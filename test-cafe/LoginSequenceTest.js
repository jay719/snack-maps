import { sign } from "crypto";
import { Selector } from "testcafe";

const helpButton = Selector('.help-text')
const helpVideo = Selector('#video')

fixture `Does help video play?`
    .page `https://snack-maps-7.web.app/`
test('Does Video Guide Properly Show', async t => {
    await t
            .click(helpButton)
            .expect(helpVideo.visible).eql(true)
})
    const signUpBtn = Selector('#signup-btn')
    const submitSignUp = Selector('.submit-signup')
    const signUpMdl = Selector('#signup-mdl')
    const signUpPassword = Selector('#passphrase')
    const signUpUserName = Selector('#user_name')
    const signUpMessage = Selector('.message')
    const closeBtn = Selector('.close')

fixture `Does Sign up Work`
    .page `https://snack-maps-7.web.app/`
    test('Make sign up modal appear and disappear after successful sign up', async t => {
        await t
            .click(signUpBtn)
            .expect(signUpMdl.visible).eql(true)
            .typeText(signUpUserName, 'user1')
            .typeText(signUpPassword, 'user1')
            .click(submitSignUp)
            .expect(signUpMessage.visible).eql(true)
            .click(closeBtn)
            .expect(signUpMdl.visible).eql(false) 
            
    })

fixture `Log in to Snack Maps`
    .page `https://snack-maps-7.web.app/`

test('Click Sign in Buttom input credentials and verify signed in message appears', async t => {
    const submitSignInButton = Selector('.submit-signin')
    const signedInMessage = Selector('.message2')
    const signInButton = Selector('#signin-btn')
    const signInPassword = Selector('#password')
    const signInUserName = Selector('#username')

        await t
            .click(signInButton)
            .expect(submitSignInButton.visible).eql(true)
            .typeText(signInUserName, 'user1')
            .typeText(signInPassword, 'user1')
            .click(submitSignInButton)
            .expect(signedInMessage.visible).eql(true)
            console.log('done')

})
