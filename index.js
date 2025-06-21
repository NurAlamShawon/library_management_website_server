require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.tbuverl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    /*books*/

    const database = client.db("books");
    const bookcollection = database.collection("book");
    // get data

    app.get("/books", async (req, res) => {
      const category = req.query.category;
      const query = {};
      if (category) {
        query.category = category;
      }
      const cursor = bookcollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookcollection.findOne(query);
      res.send(result);
    });

    const defaultBooks = [
      {
        image: "https://covers.openlibrary.org/b/id/10521236-L.jpg",
        name: "Pride and Prejudice",
        quantity: 8,
        author: "Jane Austen",
        category: "Fiction",
        shortDescription:
          "A timeless novel about love, class, and misunderstandings in 19th century England.",
        rating: 4.6,
        bookContent:
          "Published in 1813, this beloved classic explores the emotional development of Elizabeth Bennet and her complex relationship with Mr. Darcy.",
      },
      {
        image: "https://covers.openlibrary.org/b/id/8226191-L.jpg",
        name: "Dracula",
        quantity: 6,
        author: "Bram Stoker",
        category: "Horror",
        shortDescription:
          "The chilling tale of Count Dracula's attempt to move from Transylvania to England.",
        rating: 4.3,
        bookContent:
          "A Gothic horror masterpiece that shaped modern vampire lore, exploring fear, seduction, and the unknown.",
      },
      {
        image: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
        name: "The Time Machine",
        quantity: 5,
        author: "H.G. Wells",
        category: "Science",
        shortDescription:
          "A scientist ventures through time to discover the fate of humanity.",
        rating: 4.2,
        bookContent:
          "Published in 1895, this pioneering science fiction novel examines social evolution and technological progress.",
      },
      {
        image: "https://covers.openlibrary.org/b/id/11141529-L.jpg",
        name: "Sapiens: A Brief History of Humankind",
        quantity: 10,
        author: "Yuval Noah Harari",
        category: "History",
        shortDescription:
          "A global overview of human evolution, society, and culture.",
        rating: 4.7,
        bookContent:
          "An insightful journey from the cognitive revolution to today’s data-driven world — blending history with anthropology.",
      },
      {
        image: "https://covers.openlibrary.org/b/id/5541061-L.jpg",
        name: "Charlotte's Web",
        quantity: 12,
        author: "E.B. White",
        category: "Children",
        shortDescription:
          "A heartwarming story of friendship between a pig and a spider.",
        rating: 4.8,
        bookContent:
          "This beloved children’s classic teaches compassion, loyalty, and the power of words through a magical barnyard tale.",
      },
      {
        image: "https://covers.openlibrary.org/b/id/8231995-L.jpg",
        name: "Frankenstein",
        quantity: 4,
        author: "Mary Shelley",
        category: "Horror",
        shortDescription:
          "A scientist creates life, only to be haunted by his monstrous creation.",
        rating: 4.4,
        bookContent:
          "More than a horror story, this novel explores ambition, isolation, and the consequences of playing god.",
      },
    ];

    // if the database is empty that time it will put the default data
    const insertDefaultData = async () => {
      await client.connect();
      const count = await bookcollection.countDocuments();
      if (count === 0) {
        await bookcollection.insertMany(defaultBooks);
        console.log("Default books data inserted.");
      } else {
        console.log("Default books data already exists.");
      }
    };

    insertDefaultData().catch(console.error);

    // post book
    app.post("/books", async (req, res) => {
      console.log("data posted", req.body);
      const newbook = req.body;
      const result = await bookcollection.insertOne(newbook);
      res.send(result);
    });

    //update book

    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const book = req.body;
      const update = {
        $set: {
          image: book.image,
          name: book.name,
          author: book.author,
          category: book.category,
          rating: book.rating,
        },
      };

      const option = { upset: true };
      const result = await bookcollection.updateOne(filter, update, option);
      res.send(result);
    });

    /*Borrow*/

    const borrowcollection = database.collection("borrow");

    app.get("/borrow", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = borrowcollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/borrow/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowcollection.deleteOne(query);

      //update quantity
      const filter = { _id: new ObjectId(id) };
      const book = req.body;
      const count = book.quantity + 1;
      const update = {
        $set: {
          quantity: count,
        },
      };

      const option = { upset: true };
      const result2 = await bookcollection.updateOne(filter, update, option);

      res.send(result);
    });

    app.post("/borrow", async (req, res) => {
      console.log("data posted", req.body);
      const newborrow = req.body;
      const result = await borrowcollection.insertOne(newborrow);

      //update quantity
      const id = String(req.body.id);
      const filter = { _id: new ObjectId(id) };
      const book = req.body;
      const count = book.quantity - 1;
      const update = {
        $set: {
          quantity: count,
        },
      };

      const option = { upset: true };
      const result2 = await bookcollection.updateOne(filter, update, option);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// pass- VkVrFgAZxtEsA5I9  simpleDbUser

app.get("/", (req, res) => {
  res.send("user server is running100");
});

app.listen(port, () => {
  console.log(`running server in ${port} port`);
});
