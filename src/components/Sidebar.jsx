import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
  HeartHandshake,
  Ad,
} from "lucide-react";
import menuConfig from "./menuConfig";

function MenuItem({ item }) {
  const [open, setOpen] = useState(false);

  const Icon = item.icon;

  // Parent menu with children
  if (item.children) {
    return (
      <div className="sidebar-menu-group">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="sidebar-menu-button"
          aria-expanded={open}
        >
          <div className="sidebar-menu-label">
            {Icon && <Icon size={20} />}
            <span>{item.title}</span>
          </div>

          {open ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>

        {open && (
          <div className="sidebar-submenu">
            {item.children.map((child) => (
              <MenuItem
                key={child.path || child.title}
                item={child}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal item
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `sidebar-link${isActive ? " active" : ""}`
      }
    >
      {Icon && <Icon size={20} />}
      <span>{item.title}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  /*
    Convert menuConfig:

    Brands       parentPath="/catalog"
    Categories   parentPath="/catalog"
    Products     parentPath="/catalog"

    into:

    Catalog
      Brands
      Categories
      Products
  */

  const groupedMenu = [];

  const parents = {};

  menuConfig.forEach((item) => {
    if (item.parentPath) {
      if (!parents[item.parentPath]) {
        parents[item.parentPath] = {
          title: getParentTitle(item.parentPath),
          path: item.parentPath,
          icon: getParentIcon(item.parentPath),
          children: [],
        };

        groupedMenu.push(parents[item.parentPath]);
      }

      parents[item.parentPath].children.push(item);
    } else {
      groupedMenu.push(item);
    }
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        My Store
      </div>

      <nav className="sidebar-nav">
        {groupedMenu.map((item) => (
          <MenuItem
            key={item.path || item.title}
            item={item}
          />
        ))}
      </nav>
    </aside>
  );
}


// ----------------------------------
// Parent titles
// ----------------------------------

function getParentTitle(path) {
  const parents = {
    "/catalog": "Catalog",
    "/promotions": "Promotions",
  };

  return parents[path] || path.replace("/", "");
}


// ----------------------------------
// Parent icons
// ----------------------------------

function getParentIcon(path) {
  const icons = {
    "/catalog": Package,
    "/promotions": Ad,
  };

  return icons[path] || Package;
}