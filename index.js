const express = require("express");
const cors = require("cors");
const jwt= require("jsonwebtoken")
const cookieParser= require("cookie-parser")
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser())

const logger=(req,res,next)=>{
  console.log("inside the logger")
  next()
}
const verifyToken=(req,res,next)=>{
  // console.log("inside verify token for middleware ", req.cookies)
  const token=req?.cookies?.token
  if(!token){
    return res.status(401).send({message:" unauthorized access "})
  }
  jwt.verify(token,process.env.JWT_SECRET,(err, decoded)=>{
    if(err){
      return res.send({message: "Unauthorized access"}).status(401)
    }
    req.user=decoded
    next()
  })
  
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4lbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const jobCollection = client.db("jobportal").collection("jobs");
    const applicationCollection = client
      .db("jobportal")
      .collection("application");


      //Auth related apis
      app.post("/jwt", (req,res)=>{
        const user =req.body
        const token=jwt.sign(user,process.env.JWT_SECRET, {expiresIn: '1h'})
        res
        .cookie('token', token, {httpOnly:true,secure:false})
        .send({succuss:true})
      })

    //jobs related api
    app.get("/jobs", logger, async (req, res) => {
      console.log('now inside the callBack')
      const email = req.query.email;
      let query = {};
      if (email) {
        query = {
          hr_email: email,
        };
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);

      res.send(result);
    });

    //job application apis
    app.get("/job-application/jobs/:job_id", async (req,res)=>{
      const jobId=req.params.job_id
      const query= {job_id : jobId}
      const result= await applicationCollection.find(query).toArray()
      res.json(result)
    }) 
    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      //not the best way (use aggregate)
      const id =application.job_id
      const query ={_id : new ObjectId(id)}
      const job= await jobCollection.findOne(query)
      let newCount = 0
      if(job.applicationCount){
        newCount=job.applicationCount + 1
      }
      else{
        newCount=1
      }
      const filter={_id: new ObjectId(id)}
      const updateDoc={
        $set :{
          applicationCount:newCount
        }
      }
      const updateResult= await jobCollection.updateOne(filter,updateDoc)
      if(updateResult.modifiedCount>0){
        res.send(result);
      }
      
    });

    
    app.get("/job-application", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access '})
      }
      const result = await applicationCollection.find(query).toArray();
      //fokira way to load data / aggregate data
      for (const application of result) {
        // console.log(application.job_id)
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }
      res.send(result);
    });
    app.patch("/job-application/:id", async (req,res)=>{
      const id = req.params.id
      const data=req.body
      const filter = {_id : new ObjectId(id)}
      const updatedDoc={
        $set:{
          status:data.status
        }
      }
      const result= await applicationCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    //new job created apis
    app.post("/jobs", async (req, res) => {
     
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
