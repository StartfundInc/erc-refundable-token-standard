const HelloERC20 = artifacts.require('./examples/HelloERC20')

contract('BasicToken', accounts => {
    const [owner, user1, user2] = accounts
    let initalBalance
    let token
    before(async () => {
        //deployer.deploy(sender, 'foo', 'bar')
        //token = await HelloERC20.new(name, symbol, txParams)
        token = await HelloERC20.new(owner, 10000)
        initalBalance = await token.balanceOf(owner)
    })

    it('should mint total supply of tokens to initial account', async () => {
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
