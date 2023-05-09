describe("template spec", () => {
  // Don't target elements based on CSS attributes such as: id, class, tag
  // Don't target elements that may change their textContent
  // Add data-* attributes to make it easier to target elements
  const errorMessage =
    "What did you break 😡💢...confusion... Please contact javariab17@gmail.com";
  // Notes/What could change: Set cy.gets to page objects, split up tests as much as possible, add data-cy to elements
  it("can visit site", () => {
    cy.visit("https://snack-maps-7.web.app/");
  });
  it("can visit site, view sign up modal, and merror message appears", () => {
    cy.visit("https://snack-maps-7.web.app/");
    cy.contains("Sign Up").click();
    cy.log("Sign up botton clickable");
    cy.get("#banana").should("be.visible");
    cy.log("banana visible");
    cy.get("#user_name").type("testing");
    cy.get("#passphrase").type("ahhhhhhhhhhhh");
    cy.log("Typing donnneee");
    cy.get(".submit-signup").click();
    cy.get(".message").should("be.visible").and("have.text", errorMessage);
  });
});
