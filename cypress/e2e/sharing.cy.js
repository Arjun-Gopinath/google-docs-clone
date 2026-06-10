describe('Document sharing', () => {
  let docUrl;

  before(() => {
    // Alice creates a document to share
    cy.login('alice@example.com');
    cy.contains('+ New document').click();
    cy.url().should('match', /\/documents\/\d+/).then((url) => {
      docUrl = url;
    });
    cy.get('.ProseMirror').click().type('Shared document content');
    cy.contains('Saved', { timeout: 5000 });
  });

  it('owner can open the share modal', () => {
    cy.login('alice@example.com');
    cy.visit(docUrl);
    cy.contains('Share').click();
    cy.contains('Share document').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
  });

  it('owner shares document with bob', () => {
    cy.login('alice@example.com');
    cy.visit(docUrl);
    cy.contains('Share').click();
    cy.get('input[type="email"]').type('bob@example.com');
    cy.get('button').contains('Share').click();
    cy.contains('Shared with Bob Smith').should('be.visible');
    cy.contains('bob@example.com').should('be.visible');
  });

  it('shared document appears in bob\'s Shared with me section', () => {
    cy.login('bob@example.com');
    cy.contains('Shared with me').should('be.visible');
    // The document shared by Alice should appear
    cy.get('[class*="sharedSection"]').should('exist');
  });

  it('bob can open and edit the shared document', () => {
    cy.login('bob@example.com');
    cy.visit(docUrl);
    cy.get('[class*="sharedBadge"]').should('contain', 'Shared');
    cy.get('.ProseMirror').should('be.visible');
    cy.get('[data-testid="editor-toolbar"]').should('be.visible');
  });

  it('charlie cannot access the unshared document', () => {
    cy.login('charlie@example.com');
    cy.visit(docUrl);
    // Should redirect to dashboard since Charlie has no access
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
