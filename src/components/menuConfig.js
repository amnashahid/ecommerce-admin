import {
  LayoutDashboard,
  Tags,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  Settings,
  HeartHandshake,
  Rss,
  UserRoundGroup,
  Settings2,
} from "lucide-react";

const menuConfig = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Brands",
    parentPath: "/catalog",
    path: "/catalog/brands",
    icon: Tags,
  },
//   {
//     title: "Catalog",
//     icon: Package,
//     children: [
//       {
//         title: "Brands",
//         path: "/brands",
//         icon: Tags,
//       },
//       {
//         title: "Categories",
//         path: "/categories",
//         icon: FolderTree,
//       },
//       {
//         title: "Products",
//         path: "/products",
//         icon: Package,
//       },
//     ],
//   },
//   {
//     title: "Orders",
//     path: "/orders",
//     icon: ShoppingCart,
//   },
//   {
//     title: "Customers",
//     path: "/customers",
//     icon: Users,
//   },
  {
    title: "Categories",
    parentPath: "/catalog",
    path: "/catalog/categories",
    icon: FolderTree,
  },
  {
    title: "Products",
    parentPath: "/catalog",
    path: "/catalog/products",
    icon: Package,
  },
  {
    title: "Orders",
    path: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Banners",
    path: "/banners",
    icon: Rss,
  },
  {
    title: "Deals",
    parentPath: "/promotions",
    path: "/promotions/deals",
    icon: HeartHandshake,
  },
  {
    title: "Customers",
    path: "/Customers",
    icon: UserRoundGroup,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
//   {
//     title: "Settings",
//     path: "/settings",
//     icon: Settings,
//   }
];

export default menuConfig;