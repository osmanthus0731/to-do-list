// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// NAVIGATIONMENU-01 Imports
// NAVIGATIONMENU-02 Navigation menu and inputs
// NAVIGATIONMENU-03 Choose a view
// NAVIGATIONMENU-04 Choose a category
// NAVIGATIONMENU-05 Screen layout and controls

// The parent passes values and callback functions as props. This menu calls those functions
// when a user picks a view or category.
// SECTION NAVIGATIONMENU-01 | Imports
import { Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { categories, Filters, Task } from "@/types/task";
interface Props {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  view: "list" | "calendar";
  setView: (view: "list" | "calendar") => void;
  filters: Filters;
  onCategory: (category: Filters["category"]) => void;
}
// SECTION NAVIGATIONMENU-02 | Navigation menu and inputs
export default function NavigationMenu({
  open,
  onClose,
  tasks,
  view,
  setView,
  filters,
  onCategory,
}: Props) {
  // SECTION NAVIGATIONMENU-03 | Choose a view
  function navigate(next: "list" | "calendar") {
    setView(next);
    onClose();
  }
  // SECTION NAVIGATIONMENU-04 | Choose a category
  function category(value: Filters["category"]) {
    onCategory(value);
    onClose();
  }
  // SECTION NAVIGATIONMENU-05 | Screen layout and controls
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="navigation-menu" id="workspace-menu">
        <div className="navigation-heading">
          <h2>Workspace</h2>
          <IconButton aria-label="Close navigation menu" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <nav aria-label="Workspace">
          <button
            className={`nav-item ${view === "list" ? "active" : ""}`}
            onClick={() => navigate("list")}
          >
            <GridViewOutlinedIcon />
            My tasks<span className="nav-count">{tasks.length}</span>
          </button>
          <button
            className={`nav-item ${view === "calendar" ? "active" : ""}`}
            onClick={() => navigate("calendar")}
          >
            <CalendarMonthOutlinedIcon />
            Calendar
          </button>
        </nav>
        <div className="workspace-label categories-label">COLLECTIONS</div>
        <div className="collections">
          <button
            className={filters.category === "all" ? "selected" : ""}
            onClick={() => category("all")}
          >
            <span className="collection-dot all" />
            All categories<span>{tasks.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={filters.category === c ? "selected" : ""}
              onClick={() => category(c)}
            >
              <span className={`collection-dot ${c.toLowerCase()}`} />
              {c}
              <span>{tasks.filter((t) => t.category === c).length}</span>
            </button>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
