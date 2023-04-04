import express from "express"
import createHttpError from "http-errors"
import BlogpostsModel from "./model.js"
import q2m from "query-to-mongo"
import { basicAuthMiddleware } from "../lib/auth/basic.js"
import { adminOnlyMiddleware } from "../lib/auth/admin.js"
import AuthorsModel from "./model.js"

const blogpostsRouter = express.Router()

blogpostsRouter.post("/", basicAuthMiddleware, async (req, res, next) => {
    try {
        const newBlogpost = new BlogpostsModel({ ...req.body, author: req.author._id })
        const { _id } = await newBlogpost.save()
        res.status(201).send({ _id })
    } catch (error) {
        next(error)
    }
})

blogpostsRouter.get("/", basicAuthMiddleware, async (req, res, next) => {
    try {
        const mongoQuery = q2m(req.query)
        const total = await BlogpostsModel.countDocuments(mongoQuery.criteria)
        const blogposts = await BlogpostsModel.find()
        res.send({
            links: mongoQuery.links("http://localhost:3001/blogposts", total),
            total,
            numberOfPages: Math.ceil(total / mongoQuery.options.limit),
            blogposts
        })
    } catch (error) {
        next(error)
    }
})


blogpostsRouter.get("/me/stories", basicAuthMiddleware, async (req, res, next) => {
    try {
        const mongoQuery = q2m(req.query)
        const blogposts = await BlogpostsModel.find({ author: req.author._id })
        res.send({
            blogposts
        })
    } catch (error) {
        next(error)
    }
})

//USER blogpost put
blogpostsRouter.put("/me/:blogpostID", basicAuthMiddleware, async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(req.params.blogpostID, req.body, { new: true, runValidators: true })
            res.send(updatedBlogpost)
        } else {
            next(createHttpError(404, `Author with id ${req.params.blogpostID} not found!`))
        }

    } catch (error) {
        next(error)
    }
})

blogpostsRouter.delete("/me/:blogpostID", basicAuthMiddleware, async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            const deletedBlogpost = await BlogpostsModel.findOneAndDelete(req.params.blogpostID)
            res.status(204).send()
        } else {
            next(createHttpError(404, `Author with id ${req.params.blogpostID} not found!`))
        }

    } catch (error) {
        next(error)
    }
})

blogpostsRouter.get("/:blogpostID", async (req, res, next) => {
    try {
        const mongoQuery = q2m(req.query)
        const blogpost = await BlogpostsModel.find({ _id: req.params.blogpostID })
        if (blogpost) {
            res.send(blogpost)
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//ADMIN PUT
blogpostsRouter.put("/:blogpostID", basicAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
    try {
        const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(
            req.params.blogpostID,
            req.body,
            { new: true, runValidators: true }
        )
        if (updatedBlogpost) {
            res.send(updatedBlogpost)
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//ADMIN DELETE
blogpostsRouter.delete("/:blogpostID", basicAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
    try {
        const deletedBlogpost = await BlogpostsModel.findByIdAndDelete(req.params.blogpostID)
        if (deletedBlogpost) {
            res.status(204).send()
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})


//adds a new comment for the specified blog post
blogpostsRouter.post("/:blogpostID", async (req, res, next) => {
    try {
        const comment = { ...req.body, createdAt: new Date(), updatedAt: new Date() }
        const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(
            req.params.blogpostID,
            { $push: { comments: comment } },
            { new: true, runValidators: true })
        if (updatedBlogpost) {
            res.send(updatedBlogpost)
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//returns all the comments for the specified blog post
blogpostsRouter.get("/:blogpostID/comments", async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            res.send(blogpost.comments)
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//returns a single comment for the specified blog post
blogpostsRouter.get("/:blogpostID/comments/:commentID", async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            const comment = blogpost.comments.find(comment => comment._id.toString() === req.params.commentID)
            if (comment) {
                res.send(comment)
            } else {
                next(createHttpError(404, `Comment with id ${req.params.commentID} not found!`))
            }
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})


//edit the comment belonging to the specified blog post
blogpostsRouter.put("/:blogpostID/comments/:commentID", async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            const index = blogpost.comments.findIndex(comment => comment._id.toString() === req.params.commentID)
            if (index !== -1) {
                blogpost.comments[index] = { ...blogpost.comments[index].toObject(), ...req.body }
                await blogpost.save()
                res.send(blogpost)
            } else {
                next(createHttpError(404, `Comment with id ${req.params.commentID} not found!`))
            }
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//delete the comment belonging to the specified blog post
blogpostsRouter.delete("/:blogpostID/comments/:commentID", async (req, res, next) => {
    try {
        const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(
            req.params.blogpostID,
            { $pull: { comments: { _id: req.params.commentID } } },
            { new: true, runValidators: true }
        )
        if (updatedBlogpost) {
            res.send(updatedBlogpost)
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//liking a blogpost || thanks to code guru yasir ozdemir
blogpostsRouter.put("/:blogpostID/likes", async (req, res, next) => {
    try {
        const blogpost = await BlogpostsModel.findById(req.params.blogpostID)
        if (blogpost) {
            if (!blogpost.likes.includes(req.body.authorID.toString())) {
                console.log("does not include, lets add")
                const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(
                    req.params.blogpostID,
                    { $push: { likes: req.body.authorID } },
                    { new: true, runValidators: true })
                res.send({ message: `Author with id ${req.body.authorID} liked the blogpost with id ${req.params.blogpostID}!`, count: updatedBlogpost.likes.length, isLiked: true })
            } else {
                console.log("includes, lets delete")
                const updatedBlogpost = await BlogpostsModel.findByIdAndUpdate(
                    req.params.blogpostID,
                    { $pull: { likes: req.body.authorID } },
                    { new: true, runValidators: true })
                res.send({ message: `Author with id ${req.body.authorID} disliked the blogpost with id ${req.params.blogpostID}!`, count: updatedBlogpost.likes.length, isLiked: false })
            }
        } else {
            next(createHttpError(404, `Blogpost with id ${req.params.blogpostID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

export default blogpostsRouter