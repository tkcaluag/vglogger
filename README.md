# VGLogger

Log all your favorite games with your ratings and rankings, keep track of all the games you've completed, plan to play, and currently playing all displayed on your profile!

## Supabase Auth

Enable the Email provider and add each app origin's `/auth/confirm` URL to Supabase's Auth redirect URL allowlist (for example, `http://localhost:3000/auth/confirm`). Sign-up stores the supplied username as `user_metadata.username`.