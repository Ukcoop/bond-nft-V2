describe('main user flow', () => {
  it('visits homepage', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  })
})
