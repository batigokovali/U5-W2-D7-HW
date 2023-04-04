import mongoose from "mongoose"

const { Schema, model } = mongoose

const blogpostsSchema = new Schema(
    {
        category: { type: String, required: true },
        title: { type: String, required: true },
        cover: { type: String, required: true },
        readTime: {
            value: { type: Number, required: true },
            unit: {
                type: String, required: true,
                validate: {
                    validator: function (unit) {
                        return ["seconds", "minutes", "hours", "years"].includes(unit);
                    },
                    message: "Unit must be one of 'seconds', 'minutes','hours' or 'years'!",
                },
            }
        },
        author: {
            type: Schema.Types.ObjectId, ref: "Author"
        },
        likes: [{ type: Schema.Types.ObjectId, ref: "Author" }],
        content: { type: String, required: true },
        comments: [{
            text: { type: String, required: true },
            author: { type: Schema.Types.ObjectId, ref: "Author" },
            createdAt: { type: Date, required: true },
            updatedAt: { type: Date, required: true }
        }]
    },
    {
        timestamps: true,
    }
)

blogpostsSchema.static("findBlogpostsWithAuthors", async function (query) {
    console.log("THIS:", this)
    const blogposts = await this.find(query.criteria, query.options.fields)
        .limit(query.options.limit)
        .skip(query.options.skip)
        .sort(query.options.sort)
        .populate({ path: "author likes comments.author", select: "firstName lastName avatar" })
    const total = await this.countDocuments(query.criteria)
    return { blogposts, total }
})

blogpostsSchema.static("findBlogpostWithAuthor", async function (id) {
    const blogpost = await this.findById(id).populate({
        path: "author likes comments.author", select: "firstName lastName",
    });
    return blogpost;
});

export default model("Blogpost", blogpostsSchema)