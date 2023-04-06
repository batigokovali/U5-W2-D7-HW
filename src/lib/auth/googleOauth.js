import GoogleStrategy from "passport-google-oauth20"
import UsersModel from "../../users/model.js"
import { createAccessToken } from "./tools.js"

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: `${process.env.API_URL}/users/googleRedirect`,
    },
    async (_, __, profile, passportNext) => {
        // This function is executed when Google sends us a successfull response
        // Here we are going to receive some informations about the user from Google (scopes --> profile, email)
        try {
            const { email, given_name, family_name, sub } = profile._json
            console.log("PROFILE:", profile)
            // 1. Check if the user is already in db
            const user = await UsersModel.findOne({ email })
            if (user) {
                // 2. If he is there --> generate an accessToken (optionally also a refreshToken)
                const accessToken = await createAccessToken({ _id: user._id, role: user.role })

                // 2.1 Then we can go next (to /googleRedirect route handler function)
                passportNext(null, { accessToken })
            } else {
                // 3. If user is not in our db --> create that
                const newUser = new UsersModel({
                    firstName: given_name,
                    lastName: family_name,
                    email,
                    googleId: sub,
                })

                const createdUser = await newUser.save()

                // 3.1 Then generate an accessToken (optionally also a refreshToken)
                const accessToken = await createAccessToken({ _id: createdUser._id, role: createdUser.role })

                // 3.2 Then we go next (to /googleRedirect route handler function)
                passportNext(null, { accessToken })
            }
        } catch (error) {
            // 4. In case of errors we gonna catch'em and handle them
            passportNext(error)
        }
    }
)

export default googleStrategy  