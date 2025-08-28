const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB (Atlas or local)
mongoose.connect("your-mongodb-uri", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Routes
app.use("/coins", require("./routes/coins"));
app.use("/bet", require("./routes/bet"));
app.use("/marketplace", require("./routes/marketplace"));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
