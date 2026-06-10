describe('File upload', () => {
  beforeEach(() => cy.login());

  it('uploads a .txt file and opens a new document with its content', () => {
    const fileName = 'test-upload.txt';
    const fileContent = 'Hello from uploaded file\nThis is line two';

    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from(fileContent), fileName, mimeType: 'text/plain' },
      { force: true }
    );

    cy.url().should('match', /\/documents\/\d+/, { timeout: 10000 });
    cy.get('.ProseMirror', { timeout: 8000 }).should('contain.text', 'Hello from uploaded file');
  });

  it('shows an error for unsupported file types', () => {
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('%PDF-fake'), fileName: 'test.pdf', mimeType: 'application/pdf' },
      { force: true }
    );

    cy.get('@alertStub', { timeout: 5000 }).should('have.been.called');
  });
});
