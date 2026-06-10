describe('Document creation and editing', () => {
  beforeEach(() => cy.login());

  it('creates a new document and opens the editor', () => {
    cy.contains('+ New document').click();
    cy.url().should('match', /\/documents\/\d+/);
    cy.get('[data-testid="editor-toolbar"]').should('be.visible');
  });

  it('shows the document in My Documents after creation', () => {
    cy.contains('+ New document').click();
    cy.url().should('match', /\/documents\/\d+/);
    cy.get('button').contains('←').click().then(() => {
      // Back navigation via the blue docs icon button
    });
    cy.visit('/');
    cy.contains('My Documents').should('be.visible');
  });

  it('can type content and apply bold formatting', () => {
    cy.contains('+ New document').click();
    cy.get('.ProseMirror').click().type('Hello bold world');
    cy.get('[data-testid="editor-toolbar"]').within(() => {
      cy.get('[title="Bold"]').click();
    });
    // Verify toolbar shows bold as active
    cy.get('[title="Bold"]').should('have.attr', 'aria-pressed', 'true');
  });

  it('auto-saves and shows Saved status', () => {
    cy.contains('+ New document').click();
    cy.get('.ProseMirror').click().type('Auto-save test content');
    cy.contains('Saved', { timeout: 5000 }).should('be.visible');
  });

  it('content persists after page reload', () => {
    cy.contains('+ New document').click();
    cy.url().then((url) => {
      const docId = url.split('/').pop();
      cy.get('.ProseMirror').click().type('Persistent content test');
      cy.contains('Saved', { timeout: 5000 }).should('be.visible');
      cy.visit(url);
      cy.get('.ProseMirror').should('contain.text', 'Persistent content test');
    });
  });

  it('renames a document inline on the dashboard', () => {
    cy.contains('+ New document').click();
    cy.visit('/');
    cy.get('.ProseMirror').should('not.exist'); // back on dashboard

    cy.get('[title="Rename"]').first().click();
    cy.get('input[class*="titleInput"]').first().clear().type('Renamed Title{enter}');
    cy.contains('Renamed Title').should('be.visible');
  });
});
