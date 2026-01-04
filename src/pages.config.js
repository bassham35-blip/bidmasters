import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';


export const PAGES = {
    "Profile": Profile,
    "SellerDashboard": SellerDashboard,
    "Auctions": Auctions,
    "AuctionDetail": AuctionDetail,
}

export const pagesConfig = {
    mainPage: "Profile",
    Pages: PAGES,
};