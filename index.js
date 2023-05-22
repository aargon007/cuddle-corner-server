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
	useNewUrlParser: true,
	useUnifiedTopology: true,
	maxPoolSize: 60,
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		// client.connect();

		const toyCollection = client.db("toyDB").collection("allToys");

		// Creating index on toyName fields
		const indexKeys = { toyName: 1 };
		const indexOptions = { name: "toyName" };
		const result = await toyCollection.createIndex(indexKeys, indexOptions);
		// console.log(result);

		//get all toys from db (latest on top)
		app.get("/all-toys", async (req, res) => {
			const toys = await toyCollection
				.find({})
				.sort({ createdAt: -1 })
				.limit(20)
				.toArray();
			res.send(toys);
		});

		//load single toy details based on id
		app.get("/toy/:id", async (req, res) => {
			const id = req.params.id;
			const toy = await toyCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(toy);
		});

		//get toy list by their name - search feature
		app.get("/all-toys/:text", async (req, res) => {
			const searchKey = req.params.text;
			const result = await toyCollection
				.find({
					$or: [{ toyName: { $regex: searchKey, $options: "i" } }],
				})
				.toArray();
			res.send(result);
		});

		//find toy list for single user - alternative method
		app.get("/my-toys/:email", async (req, res) => {
			const email = req.params.email;
			const myToys = await toyCollection
				.find({
					sellerEmail: email,
				})
				.toArray();
			res.send(myToys);
		});

		//query toy item by email and price sorting
		app.get("/my-toys", async (req, res) => {

			let query = {};
			let sorts = req.query.isAscending;

			if(req.query.sellerEmail){
				query = {
					sellerEmail : req.query.sellerEmail
				};
			}
			// console.log(query);
			const myToys = await toyCollection
				.find(
					query
				)
				.sort({ price : sorts == "true" ? 1 : -1 })
				.toArray();
			res.send(myToys);
		});

		//queary by sub category
		app.get("/category", async (req, res) => {

			let query = {};

			if(req.query.value && req.query.label){
				query = {
					sub_category : {
						value : req.query.value,
						label : req.query.label,
					}
				};
			}
			// console.log(query);
			const subToys = await toyCollection
				.find(
					query
				)
				.toArray();
			res.send(subToys);
		});

		//add toy to db
		app.post("/add-toy", async (req, res) => {
			//get details from client
			const body = req.body;
			body.createdAt = new Date();
			// console.log(body);
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

		//update data
		app.put("/updateToy/:id", async (req, res) => {
			const id = req.params.id;
			const body = req.body;
			console.log(body);
			const filter = { _id: new ObjectId(id) };
			const updateToyItem = {
				$set: {
					price: body.price,
					quantity: body.quantity,
					description: body.description,
					image: body.image,
				},
			};
			const result = await toyCollection.updateOne(filter, updateToyItem);
			res.send(result);
		});

		//delete an toy item
		app.delete("/deleteToy/:id", async (req, res) => {
			const id = req.params.id;
			const myItem = { _id: new ObjectId(id) };
			const result = await toyCollection.deleteOne(myItem);
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
