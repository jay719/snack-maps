import { sign } from "crypto";
import { Selector } from "testcafe";

fixture `Log in to Snack Maps`
    .page `https://snack-maps-7.web.app/`

test('Click Sign in Buttom input credentials and verify we go back to log in page', async t => {
    const submitSignInButton = Selector('.submit-signin')
    const signedInMessage = Selector('.message2')
    const signInButton = Selector('#signin-btn')
    const signInPassword = Selector('#password')
    const signInUserName = Selector('#username')

        await t
            .click(signInButton)
            .expect(submitSignInButton.visible).eql(true)
            .typeText(signInUserName, 'tes')
            .typeText(signInPassword, 'tes')
            .click(submitSignInButton)
            .expect(signedInMessage.visible).eql(true)
            console.log('done')

})