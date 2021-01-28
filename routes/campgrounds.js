const express = require('express')
const router = express.Router();
const { campgroundSchema } = require('../schemas.js');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const isLoggedIn = require('../middleware')
const multer = require('multer')
const { storage } = require('../cloudinary')
const upload = multer({storage})

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {5
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}));

router.get('/new', isLoggedIn,(req, res) => {
  
    res.render('campgrounds/new');

})



router.post('/', isLoggedIn,upload.array('image'),validateCampground, catchAsync(async (req, res, next) => {
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    campground.image = req.files.map(f => ({ url: f.path, filename : f.filename }))
    campground.author = req.user._id
    await campground.save();
    console.log(campground);
    req.flash('success','Successfully made a New campground')
    res.redirect(`/campgrounds/${campground._id}`)
}))

router.get('/:id', catchAsync(async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate('reviews').populate('author');
    if(!campground){
        req.flash('error',"Error Campground not Found")
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}));

router.get('/:id/edit',isLoggedIn ,catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', { campground });
}))

router.put('/:id',isLoggedIn ,validateCampground,upload.array('image'), catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename : f.filename }))
    campground.image.push(...imgs)
    await campground.save()
    req.flash('success','Successfully Updated campground')

    res.redirect(`/campgrounds/${campground._id}`)
}));

router.delete('/:id', isLoggedIn,catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('deleted','Successfully deleted campground')
    res.redirect('/campgrounds');
}));
module.exports = router;