const ERC20Mockup = artifacts.require('./examples/ERC20Mockup')

contract('ERC20Mockup', accounts => {
    const [owner, user1, user2] = accounts
    let initalBalance
    let token
    before(async () => {
        token = await ERC20Mockup.new(owner, 10000)
        initalBalance = await token.balanceOf(owner)
    })

    it('owner balance must be equal with total supply', async () => {
        const balance = await token.balanceOf(owner)
        assert(balance.eq(initalBalance))
    })
    it('after transfor should be equal total', async () => {
        await token.transfer(user1, 99, {from: owner})
        const balanceOwner = await token.balanceOf(owner)
        const balanceUser1 = await token.balanceOf(user1)
        //console.log('---', {balanceOwner, balanceUser1})
        assert(initalBalance.eq(balanceOwner.plus(balanceUser1)))
    })
})
