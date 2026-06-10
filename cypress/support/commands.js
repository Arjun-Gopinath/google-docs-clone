Cypress.Commands.add('login', (email = 'alice@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});
