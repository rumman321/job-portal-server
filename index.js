const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4lbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollection=client.db('jobportal').collection('jobs')
    const applicationCollection=client.db('jobportal').collection('application')

    //jobs related api
    app.get('/jobs', async(req,res)=>{
        const cursor=jobCollection.find()
        const result= await cursor.toArray()
        res.send(result)
    })

    app.get("/jobs/:id", async(req,res)=>{
      const id=req.params.id
      const query={_id : new ObjectId(id)}
      const result= await jobCollection.findOne(query)

      
      res.send(result)
    })

    //job application apis
    app.post("/job-application", async(req,res)=>{
      const application=req.body
      const result=await applicationCollection.insertOne(application)
      res.send(result)

    })

    app.get("/job-application",async (req,res)=>{
      const email=req.query.email     
      const query= {applicant_email: email} 
      const result= await applicationCollection.find(query).toArray()
      //fokira way to load data / aggregate data
      for(const application of result) {
        console.log(application.job_id)
        const query1= {_id :new ObjectId(application.job_id)}
        const job = await jobCollection.findOne(query1)
        if(job){
          application.title=job.title;
          application.company=job.company;
          application.company_logo=job.company_logo;
          application.location=job.location;

        }
        
      }
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("its working");
});

app.listen(port, () => {
  console.log("app is running on port ", port);
});
