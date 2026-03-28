import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import SellerOnboarding from './pages/SellerOnboarding';
import MyPurchases from './pages/MyPurchases';
import Layout from './components/Layout';


export const PAGES = {
    "Profile": Profile,
    "SellerDashboard": SellerDashboard,
    "Auctions": Auctions,
    "AuctionDetail": AuctionDetail,
    "SellerOnboarding": SellerOnboarding,
    "MyPurchases": MyPurchases,
}

export const pagesConfig = {
    mainPage: "Auctions",
    Pages: PAGES,
    Layout: Layout,
};