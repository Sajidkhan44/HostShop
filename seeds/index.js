const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author:'600e536ef011b70cc4dd1722',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            image:[
                {
                  url: 'https://res.cloudinary.com/dxflvagfb/image/upload/v1611719821/yelpcamp/va48bliacvfrt9pqxbpd.jpg',
                  filename: 'yelpcamp/va48bliacvfrt9pqxbpd'
                },
                {
                  url: 'https://res.cloudinary.com/dxflvagfb/image/upload/v1611719821/yelpcamp/sp2wtznmbx3ui9gwa9ep.jpg',
                  filename: 'yelpcamp/sp2wtznmbx3ui9gwa9ep'
                },
                {
                  url: 'https://res.cloudinary.com/dxflvagfb/image/upload/v1611719821/yelpcamp/thyd7gk2sreacrfyhopi.jpg',
                  filename: 'yelpcamp/thyd7gk2sreacrfyhopi'
                }
              ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})