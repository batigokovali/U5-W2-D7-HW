import GoogleStrategy from "passport-google-oauth20"
import AuthorsModel from "../../authors/model.js"
import { createAccessToken } from "./tools.js"

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: `${process.env.API_URL}/authors/googleRedirect`,
    },
    async (_, __, profile, passportNext) => {
        try {
            const { email, given_name, family_name, sub } = profile._json
            console.log("PROFILE:", profile)
            const author = await AuthorsModel.findOne({ email }) // 1. Check if the user is already in db
            if (author) {
                const accessToken = await createAccessToken({ _id: author._id, role: author.role }) // 2. If he is there --> generate an accessToken (optionally also a refreshToken)
                passportNext(null, { accessToken }) // 2.1 Then we can go next (to /googleRedirect route handler function)
            } else {
                const newAuthor = new AuthorsModel({ // 3. If user is not in our db --> create that
                    firstName: given_name,
                    lastName: family_name,
                    email,
                    googleId: sub,
                })
                const createdAuthor = await newAuthor.save()
                const accessToken = await createAccessToken({ _id: createdAuthor._id, role: createdAuthor.role }) // 3.1 Then generate an accessToken (optionally also a refreshToken)
                passportNext(null, { accessToken }) // 3.2 Then we go next (to /googleRedirect route handler function)
            }
        } catch (error) {
            passportNext(error) // 4. In case of errors we gonna catch'em and handle them
        }
    }
)

export default googleStrategy  