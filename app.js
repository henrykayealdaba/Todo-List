//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");

const itemsSchema = new mongoose.Schema({
  name: {type: String, default: 'Nothing'}
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + Button to add new item.",
});
const item3 = new Item({
  name: "👈 Check this to delete.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Added succesfully");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
      mongoose.connection.close();
    });
});

app.get('/:customListName', function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).exec().then(function(foundList){
    if(!foundList){
      console.log("Doesn't Exist!");
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save(); 
      res.redirect('/' + customListName);
    } else {
      console.log('Exists!');
      res.render('list', {listTitle: foundList.name, newListItems: foundList.items}); 
    }
  });


});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if(listName === date.getDate()){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).exec().then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
});

app.post('/delete', function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === date.getDate()){
      Item.findByIdAndDelete(checkedItemId).then(function(){
        console.log('Delete Success');
        res.redirect('/');
      }).catch(function(err){
        console.log(err);
      });
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(){
        res.redirect('/'+listName);
      })
    }
    
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
