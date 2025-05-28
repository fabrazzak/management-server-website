const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

// Middleware
app.use(cors({
  origin: ["https://willowy-cuchufli-ba81d6.netlify.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cubbi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const managementDatabase = client.db("managementDB").collection("management");
    const BeVolunteerCollection = client.db("managementDB").collection("BeVolunteer");

    // Add post
    app.post('/add-posts', async (req, res) => {
      const addPost = req.body;
      const result = await managementDatabase.insertOne(addPost);
      res.send(result);
    });

    // Update post
    app.put('/add-posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedData = req.body;
      const data = {
        $set: {
          thumbnail: updatedData.thumbnail,
          title: updatedData.title,
          description: updatedData.description,
          category: updatedData.category,
          location: updatedData.location,
          volunteers_needed: updatedData.volunteers_needed,
          deadline: updatedData.deadline
        }
      };
      const result = await managementDatabase.updateOne(query, data, { upsert: true });
      res.send(result);
    });

    // Delete post
    app.delete('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.deleteOne(query);
      res.send(result);
    });

    // Get limited posts
    app.get("/post", async (req, res) => {
      const result = await managementDatabase.find().limit(6).toArray();
      res.send(result);
    });

    // Get all posts (with search)
    app.get("/posts", async (req, res) => {
      const search = req.query.search || "";
      const query = {
        title: {
          $regex: search,
          $options: "i",
        },
      };
      const result = await managementDatabase.find(query).toArray();
      res.send(result);
    });

    // Get user posts
    app.get("/my_posts", async (req, res) => {
      const email = req.query.email;
      const query = { organizeEmail: email };
      const result = await managementDatabase.find(query).toArray();
      res.send(result);
    });

    // Get specific post
    app.get("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.findOne(query);
      res.send(result);
    });

    // Get specific post (duplicate endpoint)
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.findOne(query);
      res.send(result);
    });

    // Volunteer for a post
    app.post("/BeVolunteer", async (req, res) => {
      const requestVolunteer = req.body;
      const query = { _id: new ObjectId(requestVolunteer.post_id) };
      const findPost = await managementDatabase.findOne(query);
      if (!findPost) {
        return res.status(404).send({ message: "Post Not Found" });
      }
      const updatePost = await managementDatabase.updateOne(query, { $inc: { volunteers_needed: -1 } });
      if (updatePost.modifiedCount === 0) {
        return res.status(500).send({ message: "Failed to update the post" });
      }
      const result = await BeVolunteerCollection.insertOne(requestVolunteer);
      res.send(result);
    });

    // Get volunteer requests
    app.get("/BeVolunteer-Post", async (req, res) => {
      const email = req.query.email;
      const query = { user_email: email };
      const result = await BeVolunteerCollection.find(query).toArray();
      res.send(result);
    });

    // Delete volunteer request
    app.delete('/BeVolunteer-Post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BeVolunteerCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Optional: Keep connection open
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Volunteer Management Server");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
