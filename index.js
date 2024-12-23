const express = require('express')
const cors= require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000
require('dotenv').config()

// middleware

app.use(cors())
app.use(express.json())


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
    
    // save a add post database db
    app.post('/add-posts',async(req,res)=>{
      const addPost= req.body;
      const result = await managementDatabase.insertOne(addPost);
      res.send(result)
    })
    // get all add post
    app.get("/posts",async(req,res)=>{
      const result =await managementDatabase.find().toArray();
      res.send(result)
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