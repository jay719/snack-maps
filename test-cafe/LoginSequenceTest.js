import { Selector } from "testcafe";

fixture `Log in to Snack Maps`
    .page 'https://snack-maps-7.web.app/';

test('Click Sign in Buttom input credentials and verify we go back to log in page', async t => {
    const signInButton = Selector()
})