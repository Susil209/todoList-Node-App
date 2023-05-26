//jshint esversion:6

//username - admin-susil
//password - iZd6LMRVgcvrVaA6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const {Schema} = mongoose;
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(process.env.PUBLIC_DIR));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// console.log(process.env.DB_PASSWORD);

// connect to database
async function main(){
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Database connected');
}

main().catch(err => console.log(err));

//Schema
const itemSchema = new Schema({
  name: String
})

//model
const Item = mongoose.model('Item', itemSchema);

//create documents
const firstItem = new Item({
  name: "Welcome to todo list"
})
const secondItem = new Item({
  name: "add any item"
})
const thirdItem = new Item({
  name: "delete any item"
})

const itemsArr = [firstItem, secondItem, thirdItem];

//create a new Schema for custom list
const listSchema = new Schema({
  name: String,
  items: [itemSchema]
});

//new model for custom list
const List = mongoose.model('List', listSchema);

//get all the items

app.get("/", async function(req, res) {
// const day = date.getDate();
  await Item.find({})
    .then((foundItems)=>{
      //insert all the items if array is empty
      if(foundItems.length === 0){
        Item.insertMany(itemsArr)
          .then(()=>{
            console.log("items added successfully");
          })
          .catch((err)=>{
            console.log(err);
          });
        res.redirect("/");
      }else{
        // console.log(foundItems);
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    })

});


//post new item

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  //create item document
  const item = new Item({
    name: itemName
  })

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    // find listName of custom list and save item in them
    List.findOne({name: listName})
      .then((foundList)=>{ // Find the list array
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
      })
      .catch((e)=>{
        console.log(e);
      })
  }

});

app.post("/delete",async function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
      await Item.findByIdAndRemove({_id: checkedItemId})
        .then((checkedItemId)=>{
            console.log(`id ${checkedItemId._id} deleted successfully.`);
            res.redirect("/");
        })
        .catch((err)=>{
          console.log(err);
        })
    }else{
      //The $pull operator removes from an existing array all instances of a value or values that match a specified condition.
        await List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: checkedItemId}}} )
          .then((foundList)=>{
              res.redirect("/" + listName);
          })
          .catch((err)=>{
            console.log(err);
          })
    }



});

//create a custom list
app.get("/:newRoute", function(req,res){
  // res.render("list", {listTitle: "Work List", newListItems: workItems});
  const listName =  _.capitalize(req.params.newRoute);

  List.findOne({name: listName})
    .then((foundList)=>{
        if(foundList){
          console.log(`list with name ${foundList.name} already exist`);
          res.render("list", {listTitle: foundList.name , newListItems: foundList.items})
        }else{
          // create a list collection
          const list = new List({
            name: listName,
            items: itemsArr
          });

            list.save();
            console.log("List saved");
            res.redirect("/" + listName);
        }
    })
    .catch((e)=>{
      console.log(e);
    })

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
