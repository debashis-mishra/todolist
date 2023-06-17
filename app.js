//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect("mongodb+srv://fruits:admin@cluster0.mkqmi6f.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });


// Create Schema
const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};


// Create Model
const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);


// Create Documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});


// Create Array
const defaultItems = [item1, item2, item3];


app.get("/", function (req, res) {

  Item.find({}).then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved defult items to DB");
      }).catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }
    else
      res.render("list", { listTitle: "Today", newListItems: foundItems });
  }
  ).catch(function (err) {
    console.log(err);
  });

});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkedItemId).then(function () {
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    }).catch(function (err) {
      console.log(err);
    });

  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then(function (foundList) {
      res.redirect("/" + listName);
    }).catch(function (err) {
      console.log(err);
    }
    );
  }
});


app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save().then(function () {
        res.redirect("/" + customListName);
      }).catch(function (err) {
        console.log(err);
      });
    }
    else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  }).catch(function (err) {
    console.log(err);
  });

});


app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save().then(function () {
      res.redirect("/");
    }).catch(function (err) {
      console.log(err);
    });
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save().then(function () {
        res.redirect("/" + listName);
      }).catch(function (err) {
        console.log(err);
      }
      );
    }).catch(function (err) {
      console.log(err);
    }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started Successfully.");
});