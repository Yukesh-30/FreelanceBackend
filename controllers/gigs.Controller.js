import sql from "../config/dbConfig.js"
import {z} from "zod"
import { internelServerError } from "../helper/response.js";

const updateGigSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(5),
  category: z.string(),
  subcategory: z.string(),
}).partial();

const packageSchema = z.object({
  package_type : z.enum(['BASIC','STANDARD','PREMIUM']),
  price : z.number(),
  description : z.string().min(10).max(255),
  delivery_days : z.number(),
  revisions : z.number()
}).partial();

const mediaSchema = z.object({
  media_url : z.string().url()
})

const createGigSchema = z.object({
  freelancer_id: z.string(),

  title: z.string().min(5).max(255),
  description: z.string().min(10),
  category: z.string(),
  subcategory: z.string(),
  tags: z.array(z.string()),

  packages: z.array(
    z.object({
      type: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
      price: z.number().positive(),
      description: z.string(),
      delivery_days: z.number().int().positive(),
      revisions: z.number().int().min(0)
    })
  ),

  media: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["IMAGE", "VIDEO"])
    })
  )
});


const getAllGigs = async (req, res) => {
    try {
        const result = await sql`SELECT json_agg(
                                    json_build_object(
                                        'id', g.id,
                                        'freelancer_id' : g.freelancer_id,
                                        'title', g.title,
                                        'description', g.description,
                                        'category', g.category,
                                        'subcategory', g.subcategory,
                                        'tags', g.tags,
                                        'created_at', g.created_at,

                                        'packages', (
                                            SELECT COALESCE(json_agg(
                                                json_build_object(
                                                    'id', p.id,
                                                    'type', p.package_type,
                                                    'price', p.price,
                                                    'description', p.description,
                                                    'delivery_days', p.delivery_days,
                                                    'revisions', p.revisions
                                                )
                                            ), '[]'::json)
                                            FROM gigpackage p
                                            WHERE p.gig_id = g.id
                                        ),

                                        'media', (
                                            SELECT COALESCE(json_agg(
                                                json_build_object(
                                                    'id', m.id,
                                                    'url', m.media_url,
                                                    'type', m.media_type
                                                )
                                            ), '[]'::json)
                                            FROM gigmedia m
                                            WHERE m.gig_id = g.id
                                        )
                                    )
                                ) AS gigs
                                FROM gigs g;`;

        const gigs = result[0].gigs || [];

        if (gigs.length === 0) {
            return res.status(404).json({
                message: "No gigs found"
            });
        }

        return res.status(200).json({
            message: "Gigs found",
            gigs
        });

    } catch (error) {
        return res.status(500).json({
            message: internelServerError
        });
    }
};


const getGigById = async (req, res) => {
    const id = req.params.id;

    try {
        const result = await sql`
            SELECT json_build_object(
                'id', g.id,
                'freelancer_id', g.freelancer_id,
                'title', g.title,
                'description', g.description,
                'category', g.category,
                'subcategory', g.subcategory,
                'tags', g.tags,
                'created_at', g.created_at,

                'packages', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', p.id,
                            'type', p.package_type,
                            'price', p.price,
                            'description', p.description,
                            'delivery_days', p.delivery_days,
                            'revisions', p.revisions
                        )
                    ), '[]'::json)
                    FROM gigpackage p
                    WHERE p.gig_id = g.id
                ),

                'media', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', m.id,
                            'url', m.media_url,
                            'type', m.media_type
                        )
                    ), '[]'::json)
                    FROM gigmedia m
                    WHERE m.gig_id = g.id
                )

            ) AS gig
            FROM gigs g
            WHERE g.id = ${id};
        `;

        const gig = result[0]?.gig;

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found"
            });
        }

        return res.status(200).json({
            gig
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message
        });
    }
};


const getGigsByFreelancerId = async (req, res) => {
    const id = req.params.id;
  console.log(id)
    try {
        const result = await sql`
            SELECT json_build_object(
                'id', g.id,
                'freelancer_id', g.freelancer_id,
                'title', g.title,
                'description', g.description,
                'category', g.category,
                'subcategory', g.subcategory,
                'tags', g.tags,
                'created_at', g.created_at,

                'packages', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', p.id,
                            'type', p.package_type,
                            'price', p.price,
                            'description', p.description,
                            'delivery_days', p.delivery_days,
                            'revisions', p.revisions
                        )
                    ), '[]'::json)
                    FROM gigpackage p
                    WHERE p.gig_id = g.id
                ),

                'media', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', m.id,
                            'url', m.media_url,
                            'type', m.media_type
                        )
                    ), '[]'::json)
                    FROM gigmedia m
                    WHERE m.gig_id = g.id
                )

            ) AS gig
            FROM gigs g
            WHERE g.freelancer_id = ${id};
        `;

        const gig = result[0]?.gig;

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found"
            });
        }

        return res.status(200).json({
            gig
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message
        });
    }
};


const createGig = async (req, res) => {
  const validation = createGigSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors
    });
  }

  const {
    freelancer_id,
    title,
    description,
    category,
    subcategory,
    tags,
    packages,
    media
  } = validation.data;

  try {
    await sql`BEGIN`;

    const [gig] = await sql`
      INSERT INTO gigs (
        freelancer_id,
        title,
        description,
        category,
        subcategory,
        tags
      )
      VALUES (
        ${freelancer_id},
        ${title},
        ${description},
        ${category},
        ${subcategory},
        ${tags}
      )
      RETURNING id
    `;

    const gigId = gig.id;

    for (const pkg of packages) {
      await sql`
        INSERT INTO gigpackage (
          gig_id,
          package_type,
          price,
          description,
          delivery_days,
          revisions
        )
        VALUES (
          ${gigId},
          ${pkg.type},
          ${pkg.price},
          ${pkg.description},
          ${pkg.delivery_days},
          ${pkg.revisions}
        )
      `;
    }
    for (const item of media) {
      await sql`
        INSERT INTO gigmedia (
          gig_id,
          media_url,
          media_type
        )
        VALUES (
          ${gigId},
          ${item.url},
          ${item.type}
        )
      `;
    }

    await sql`COMMIT`;

    return res.status(201).json({
      message: "Gig created successfully"
    });

  } catch (error) {
    await sql`ROLLBACK`;
    console.error(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const deleteGigById = async (req,res)=>{
    const id = req.params.id

    try {
        await sql`DELETE from gigs where id=${id}`
        return res.status(200).json({
            message : "Gig deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message : internelServerError
        })
    }
}

const updateGig = async (req, res) => {
  const id = req.params.id;
  console.log(req.body)
  const validation = updateGigSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Bad request. Check the format",
      errors: validation.error.format() // Good for debugging!
    });
  }

  try {
    const gigs = await sql`SELECT * FROM gigs WHERE id=${id}`;
    const existingGig = gigs[0];

    if (!existingGig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Use 'let' so we can reassign, OR merge into a new object
    let { title, description, category, subcategory } = validation.data;

    const finalTitle = title ?? existingGig.title;
    const finalDescription = description ?? existingGig.description;
    const finalCategory = category ?? existingGig.category;
    const finalSubcategory = subcategory ?? existingGig.subcategory;

    await sql`
      UPDATE gigs 
      SET title=${finalTitle}, 
          description=${finalDescription}, 
          category=${finalCategory}, 
          subcategory=${finalSubcategory} 
      WHERE id=${id}`;

    return res.status(200).json({ message: "Updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: internelServerError });
  }
};
const getCloudinaryType = (url) => {
  if (!url) return null;

  if (url.includes('/video/upload/')) return 'VIDEO';
  if (url.includes('/image/upload/')) return 'IMAGE';
  if (url.includes('/raw/upload/')) return 'RAW'; 

  const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
  const isVideo = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  
  return isVideo ? 'VIDEO' : 'IMAGE';
};

const postMedia = async (req,res)=>{
    const id = req.params.id

    const validation = mediaSchema.safeParse(req.body)

    if(!validation.success){
      return res.status(400).json({
        message : "Bad request Format"
      })
    }

    try {
      const {media_url} = validation.data

      const media_type = getCloudinaryType(media_url)
      
      await sql`
        INSERT INTO gigmedia (gig_id, media_url, media_type) 
        VALUES (${id}, ${media_url}, ${media_type})
      `;

      return res.status(201).json({
        message: "Media inserted sucessfully"
      })
    } catch (error) {
       return res.status(500).json({
        message : internelServerError
       })
    }

}

const deleteMediaById = async (req,res) =>{
    const {id} = req.body

    

    try {
      const media = await sql`SELECT * FROM gigmedia where id=${id}`
      console.log(media)
      if(media.length===0){
        return res.status(404).json({
          messagec : "Media not found"
        })
      }

      await sql`DELETE FROM gigmedia where id=${id}`

      return res.status(200).json({
        message : "Media deleted successfully"
      })
      
    } catch (error) {
       return res.status(500).json({
        message : internelServerError
       })
    }
}

//package update
//create pakage

const createPackage = async (req,res) =>{
    const id = req.params.id

    const validation = packageSchema.safeParse(req.body)

    if(!validation.success){
      return res.status(400).json({
        message : "Bad request format"
      })
    }

    try {
        const {package_type,price,description,delivery_days,revisions} = validation.data

      await sql`INSERT INTO gigpackage(gig_id,
                  package_type,
                  price,
                  description,
                  delivery_days,
                  revisions) VALUES(${id},${package_type},${price},${description},${delivery_days},${revisions})`

      return res.status(201).json({
        message : "Package created successfully"
      })
    } catch (error) {
      return res.status(500).json({
        message : internelServerError
      })
    }
}
//delete the pack by id

const deletePackageById = async (req,res) =>{
  const id = req.params.id

  try {
    const packages = await sql`SELECT * FROM gigpackage where id=${id}`
    if(packages.length===0){
      return res.status(404).json({
        message : "Package not found"
      })
    } 

    await sql`DELETE FROM gigpackage where id=${id}`
    res.status(200).json({
      message : "Package deleted Successfully"
    })
  } catch (error) {
    return res.status(500).json({
        message : internelServerError
      })
  }

}

const updatePackageById = async (req,res)=>{
   const id = req.params.id
   const validation = packageSchema.safeParse(req.body)
   if(!validation.success){
      return res.status(400).json({
        message : "Bad request format"
      })
   }

   try {
     const pakages = await sql`SELECT * FROM gigpackage where id=${id}`
      const existingPackage = pakages[0]
      let {package_type,price,description,delivery_days,revisions} = validation.data

      package_type = package_type ?? existingPackage.package_type
      price = price ?? existingPackage.price
      description = description ?? existingPackage.description
      delivery_days = delivery_days ?? existingPackage.delivery_days
      revisions = revisions ?? existingPackage.revisions

      await sql`UPDATE gigpackage SET package_type=${package_type},price=${price},description=${description},delivery_days=${delivery_days},revisions=${revisions} where id=${id}`

      return res.status(200).json({
        message:"Package updated successfully"
      })
    
   } catch (error) {
     return res.status(500).json({
      message : internelServerError
     })
   }
   
   


}


export {getAllGigs,
  getGigById,
  createGig,
  deleteGigById,
  getGigsByFreelancerId,
  updateGig,
  postMedia,
  deleteMediaById,
  createPackage,
  deletePackageById,
  updatePackageById}
