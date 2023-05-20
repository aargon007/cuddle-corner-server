const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.njwxpap.mongodb.net/?retryWrites=true&w=majority`;

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
		client.connect();

		const toyCollection = client.db("toyDB").collection("allToys");

		// Creating index on toyName fields
		const indexKeys = { toyName: 1 }; 
		const indexOptions = { name: "toyName" };
		const result = await toyCollection.createIndex(indexKeys, indexOptions);
		// console.log(result);

		//get all toys from db
		app.get("/all-toys", async (req, res) => {
			const toys = await toyCollection
				.find({})
				.sort({ createdAt: -1 })
				.toArray();
			res.send(toys);
		});

		//add toy to db
		app.post("/add-toy", async (req, res) => {
			//get details from client
			const body = req.body;
			body.createdAt = new Date();
			console.log(body);
			//post to dbcollection
			const result = await toyCollection.insertOne(body);

			if (result?.insertedId) {
				return res.status(200).send(result);
			} else {
				return res.status(404).send({
					message: "can not post toy details, try again leter",
					status: false,
				});
			}
		});

        //get toy list by their name
        app.get("/all-toys/:text", async (req, res) => {
            const searchKey = req.params.text;
            const result = await toyCollection
              .find({
                $or: [
                  { toyName: { $regex: searchKey, $options: "i" } },
                ],
              })
              .toArray();
            res.send(result);
          });
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
	res.send("server is running");
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
