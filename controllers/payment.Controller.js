import stripe from "../config/stripe.js";
import sql from "../config/dbConfig.js";

const PLATFORM_FEE_PERCENT = 0.10;

export const fundContract = async (req, res) => {

  const contractId = req.params.contractId;
  const clientId = req.user.id;

  try {

    await sql`BEGIN`;

    const contracts = await sql`
      SELECT id, total_amount, status, client_id
      FROM contracts
      WHERE id = ${contractId}
      FOR UPDATE
    `;

    if (contracts.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({
        message: "Contract not found"
      });
    }

    const contract = contracts[0];

    if (contract.client_id !== clientId) {
      await sql`ROLLBACK`;
      return res.status(403).json({
        message: "You are not the client of this contract"
      });
    }

    if (contract.status !== "ACTIVE") {
      await sql`ROLLBACK`;
      return res.status(400).json({
        message: "Contract cannot be funded"
      });
    }

    const existingEscrow = await sql`
      SELECT id
      FROM escrow_transactions
      WHERE contract_id = ${contractId}
      AND status IN ('HELD','RELEASED')
    `;

    if (existingEscrow.length > 0) {
      await sql`ROLLBACK`;
      return res.status(400).json({
        message: "Contract already funded"
      });
    }

    const amountCents = Math.round(contract.total_amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({

      amount: amountCents,

      currency: "usd",

      metadata: {
        contractId: contract.id,
        clientId: clientId
      },

      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }

    });

    await sql`COMMIT`;

    return res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {

    await sql`ROLLBACK`;

    console.error("FUND CONTRACT ERROR:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const paymentWebhook = async (req, res) => {

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventId = event.id;

  try {

    await sql`BEGIN`;

    const existing = await sql`
      SELECT id FROM stripe_events WHERE id = ${eventId}
      FOR UPDATE
    `;

    if (existing.length > 0) {
      await sql`ROLLBACK`;
      return res.status(200).send("Already processed");
    }

    await sql`
      INSERT INTO stripe_events (id)
      VALUES (${eventId})
    `;

    if (event.type === "payment_intent.succeeded") {

      const paymentIntent = event.data.object;

      const contractId = paymentIntent.metadata.contractId;

      if (!contractId) {
        console.log("Ignoring event without contractId metadata");
        return res.status(200).send();
      }

      const amount = paymentIntent.amount / 100;

      const contract = await sql`
        SELECT freelancer_id
        FROM contracts
        WHERE id = ${contractId}
        FOR UPDATE
      `;

      const escrow = await sql`
        INSERT INTO escrow_transactions (
          contract_id,
          amount,
          status
        )
        VALUES (
          ${contractId},
          ${amount},
          'HELD'
        )
        RETURNING id
      `;

      const escrowId = escrow[0].id;

      const escrowAccount = await sql`
        SELECT id
        FROM ledger_accounts
        WHERE account_type = 'ESCROW_LIABILITY'
        LIMIT 1
      `;

      const clearingAccount = await sql`
        SELECT id
        FROM ledger_accounts
        WHERE account_type = 'STRIPE_CLEARING'
        LIMIT 1
      `;

      const escrowAccountId = escrowAccount[0].id;
      const clearingId = clearingAccount[0].id;

      await sql`
        INSERT INTO ledger_entries
        (account_id, amount, entry_type, related_contract, related_escrow, description)
        VALUES
        (${clearingId}, ${amount}, 'DEBIT', ${contractId}, ${escrowId}, 'Stripe payment received'),
        (${escrowAccountId}, ${amount}, 'CREDIT', ${contractId}, ${escrowId}, 'Funds locked in escrow')
      `;

      await sql`
        UPDATE contracts
        SET status = 'FUNDED'
        WHERE id = ${contractId}
      `;

    }

    await sql`COMMIT`;

    res.status(200).json({ received: true });

  } catch (error) {

    await sql`ROLLBACK`;

    console.error(error);

    res.status(500).send("Webhook error");
  }
};

export const getContractPaymentStatus = async (req, res) => {

  const contractId = req.params.contractId;
  const userId = req.user.id;

  try {

    const contracts = await sql`
      SELECT client_id, freelancer_id, status
      FROM contracts
      WHERE id = ${contractId}
    `;

    if (contracts.length === 0) {
      return res.status(404).json({
        message: "Contract not found"
      });
    }

    const contract = contracts[0];

    if (contract.client_id !== userId && contract.freelancer_id !== userId) {
      return res.status(403).json({
        message: "Not authorized to view this contract"
      });
    }

    const escrow = await sql`
      SELECT status, amount, released_at
      FROM escrow_transactions
      WHERE contract_id = ${contractId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (escrow.length === 0) {
      return res.json({
        status: "NOT_FUNDED"
      });
    }

    return res.json({
      status: escrow[0].status,
      amount: escrow[0].amount,
      releasedAt: escrow[0].released_at
    });

  } catch (error) {

    console.error("STATUS ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

export const releaseEscrow = async (req, res) => {

  const contractId = req.params.contractId;
  const clientId = req.user.id;

  try {

    await sql`BEGIN`;

    const contract = await sql`
      SELECT freelancer_id, client_id
      FROM contracts
      WHERE id = ${contractId}
      FOR UPDATE
    `;

    if (contract.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract[0].client_id !== clientId) {
      await sql`ROLLBACK`;
      return res.status(403).json({ message: "Not allowed" });
    }

    const escrow = await sql`
      SELECT *
      FROM escrow_transactions
      WHERE contract_id = ${contractId}
      AND status = 'HELD'
      FOR UPDATE
    `;

    if (escrow.length === 0) {
      await sql`ROLLBACK`;
      return res.status(400).json({ message: "No escrow" });
    }

    const amount = escrow[0].amount;

    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const freelancerAmount = amount - platformFee;

    const freelancerAccount = await sql`
      SELECT ledger_account_id
      FROM wallets
      WHERE user_id = ${contract[0].freelancer_id}
      FOR UPDATE
    `;

    const escrowAccount = await sql`
      SELECT id
      FROM ledger_accounts
      WHERE account_type = 'ESCROW_LIABILITY'
      LIMIT 1
    `;

    const platformAccount = await sql`
      SELECT id
      FROM ledger_accounts
      WHERE account_type = 'PLATFORM_REVENUE'
      LIMIT 1
    `;

    await sql`
      INSERT INTO ledger_entries
      (account_id, amount, entry_type, related_contract, related_escrow, description)
      VALUES
      (${escrowAccount[0].id}, ${amount}, 'DEBIT', ${contractId}, ${escrow[0].id}, 'Escrow release'),
      (${freelancerAccount[0].ledger_account_id}, ${freelancerAmount}, 'CREDIT', ${contractId}, ${escrow[0].id}, 'Freelancer payout'),
      (${platformAccount[0].id}, ${platformFee}, 'CREDIT', ${contractId}, ${escrow[0].id}, 'Platform fee')
    `;

    await sql`
      UPDATE escrow_transactions
      SET status = 'RELEASED',
          released_at = NOW()
      WHERE id = ${escrow[0].id}
    `;

    await sql`
      UPDATE contracts
      SET status = 'COMPLETED'
      WHERE id = ${contractId}
    `;

    await sql`COMMIT`;

    res.json({ success: true });

  } catch (error) {

    await sql`ROLLBACK`;

    console.error(error);

    res.status(500).json({ message: "Release failed" });
  }
};