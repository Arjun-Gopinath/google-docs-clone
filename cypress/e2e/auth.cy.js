describe('Authentication', () => {
  it('redirects unauthenticated users to /login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('logs in with valid credentials and lands on dashboard', () => {
    cy.visit('/login');
    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('My Documents').should('be.visible');
  });

  it('shows error message on wrong password', () => {
    cy.visit('/login');
    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('be.visible').and('contain', 'Invalid');
    cy.url().should('include', '/login');
  });

  it('quick-fill chips populate the email field', () => {
    cy.visit('/login');
    cy.contains('bob@example.com').click();
    cy.get('#email').should('have.value', 'bob@example.com');
  });

  it('logs out and redirects to login', () => {
    cy.login();
    cy.contains('Sign out').click();
    cy.url().should('include', '/login');
  });
});
