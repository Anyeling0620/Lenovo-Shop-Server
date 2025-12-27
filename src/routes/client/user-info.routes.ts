import { Hono } from "hono";
import { changeEmailController, changePasswordController, getAccountInfoController, getLoginUserInfoController, updateAccountInfoController, uploadAvatarController } from "../../controllers/client/user-info.controller";
import { jwtMiddleware } from "../../middleware/jwt.middleware";
import { addToShoppingCardController,
    deleteShoppingCardsController,
     getShoppingCardController } from "../../controllers/client/shop-card.controller";
import { claimCouponController, getUserCouponsController, getUserVouchersController,getUserCouponsByproductController } from "../../controllers/client/coupon-center.controller";
import { addAddressController, getAddressListController, removeAddressController, setDefaultAddressController, updateAddressController } from "../../controllers/client/address.controller";



const user = new Hono()
user.get("/login-user-info", jwtMiddleware, getLoginUserInfoController)
user.get('/account-info', jwtMiddleware, getAccountInfoController)
user.post('/upload-avatar', jwtMiddleware, uploadAvatarController)
user.post('/update-info', jwtMiddleware, updateAccountInfoController)
user.post('/change-email', jwtMiddleware, changeEmailController)
user.post('/change-password',jwtMiddleware,changePasswordController)
user.post('/add-shopping-card',jwtMiddleware, addToShoppingCardController)
user.delete('/delete-shop-cards',jwtMiddleware, deleteShoppingCardsController)
user.get('/shopping-cards',jwtMiddleware,getShoppingCardController)
user.post('/coupon-center/claim', jwtMiddleware, claimCouponController)
user.get('/coupons', jwtMiddleware, getUserCouponsController);
user.get('/vouchers',jwtMiddleware,getUserVouchersController);


user.post('/add-address', jwtMiddleware,addAddressController)    //  接收所有字段，添加后返回id，
user.put('/update-address/:address-id',jwtMiddleware,updateAddressController)   // 接收所有需要的字段，从bodyjson中获取
user.delete('/remove-address/:address-id',jwtMiddleware,removeAddressController)  
user.get('/address-list',jwtMiddleware,getAddressListController)
user.patch('/set-default/:address-id',jwtMiddleware,setDefaultAddressController)  // 将地址设为默认，只能有一个默认，如果已有默认，就取消之前的默认，重新设置这个为默认

user.get('/coupons/:product-id',jwtMiddleware, getUserCouponsByproductController)

export default user;

  
