const express = require('express')
const cors= require('cors')
const jwt = require('jsonwebtoken');
const cookieParser= require("cookie-parser");
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000
require('dotenv').config()

// middleware

app.use(cors({
  origin:['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cubbi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const managementDatabase = client.db("managementDB").collection("management");

    const  BeVolunteerCollection= client.db("managementDB").collection("BeVolunteer");

    // save a add post database db
    app.post('/add-posts',async(req,res)=>{
      const addPost= req.body;
      const result = await managementDatabase.insertOne(addPost);
      res.send(result)
    })
    // Update post
    app.put('/add-posts/:id',async(req,res)=>{
      const id = req.params.id;
      const query= {_id : new ObjectId(id)};
      const option= {upsert:true};
      const UpdatedData=req.body;
      const Data={
        $set:{
          thumbnail:UpdatedData.thumbnail,
          title:UpdatedData.title,
          description:UpdatedData.description,
          category:UpdatedData.category,
          location:UpdatedData.location,
          volunteers_needed:UpdatedData.volunteers_needed,
          deadline:UpdatedData.deadline
        }
      }
      const result = await managementDatabase.updateOne(query,Data,option);
      res.send( result)
    })
    // Delete
    app.delete('/posts/:id',async(req,res)=>{
      const id = req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await managementDatabase.deleteOne(query);
      res.send(result)
    })
    // get limit add post
    app.get("/post",async(req,res)=>{
      const result =await managementDatabase.find().limit(6).toArray();
      res.send(result)
    })
     // get all add post
     app.get("/posts",async(req,res)=>{
      const search = req.query.search || ""; 
      const query = {
        title: {
          $regex: search,
          $options: "i",
        },
      };
      const result = await managementDatabase.find(query).toArray();
      res.send(result);
    
    })

    // Get specific One data
    app.get("/post/:id", async (req,res)=>{
      const id = req.params.id;
      const query= {_id: new ObjectId(id)}
      const result = await managementDatabase.findOne(query);
      res.send( result)
    })
    
     // Get specific One data
     app.get("/posts/:id", async (req,res)=>{
      const id = req.params.id;
      const query= {_id: new ObjectId(id)}
      const result = await managementDatabase.findOne(query);
      res.send( result)
    })

    // BeVolunteer
    app.post("/BeVolunteer",async(req ,res)=>{
      const requestVolunteer= req.body;
      console.log(requestVolunteer);
      const query= {_id:new ObjectId(requestVolunteer.post_id)}
      const findPost=await managementDatabase.findOne(query)
      if (!findPost) {
        return res.status(404).send({message:"Post Not Fount"})
      }
      const updatePost= await managementDatabase.updateOne(query,{$inc:{volunteers_needed:-1}})
      if (updatePost.modifiedCount === 0) {
        return res.status(500).send({ message: "Failed to update the post" });
    }
      const result= await BeVolunteerCollection.insertOne(requestVolunteer);
      res.send(result)
    })

    // // BeVolunteer get
    app.get("/BeVolunteer-Post",async(req,res)=>{
      // const query= req.query;
      // console.log(query);
      const cursor= BeVolunteerCollection.find();
      const result=await cursor.toArray();
      res.send(result)
    })


    // Auth related Api
    app.post("/jwt",(req,res)=>{
      const user= req.body;
      const token= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn:"5h"});
      res.cookie("token",token,{
        httpOnly:true,
        secure:false
      })
      .send({success:true})
    });

    app.post("/logout",(req,res)=>{
      res.clearCookie("token",{
        httpOnly:true,
        secure:false
      })
      .send({success:true})
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Volunteer management Server")
  })


  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })