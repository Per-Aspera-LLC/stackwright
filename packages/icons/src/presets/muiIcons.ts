// Statically imported MUI icons for use in icon_grid and other components.
// Import specific icons here to keep the bundle tree-shakeable.
// Icon names match their MUI export name (e.g. "Speed" → SpeedIcon).

import Speed from "@mui/icons-material/Speed";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import CloudDone from "@mui/icons-material/CloudDone";
import Description from "@mui/icons-material/Description";
import Palette from "@mui/icons-material/Palette";
import Code from "@mui/icons-material/Code";
import Star from "@mui/icons-material/Star";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Rocket from "@mui/icons-material/Rocket";
import Lock from "@mui/icons-material/Lock";
import Language from "@mui/icons-material/Language";
import Build from "@mui/icons-material/Build";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Dashboard from "@mui/icons-material/Dashboard";
import Api from "@mui/icons-material/Api";
import Storage from "@mui/icons-material/Storage";
import Cloud from "@mui/icons-material/Cloud";
import Security from "@mui/icons-material/Security";
import People from "@mui/icons-material/People";
import TrendingUp from "@mui/icons-material/TrendingUp";

import { registerStackwrightIcons } from "../registry/iconRegistry";

export const muiIconPreset: Record<string, React.ComponentType<any>> = {
    Speed,
    VerifiedUser,
    CloudDone,
    Description,
    Palette,
    Code,
    Star,
    CheckCircle,
    Rocket,
    Lock,
    Language,
    Build,
    AutoAwesome,
    Dashboard,
    Api,
    Storage,
    Cloud,
    Security,
    People,
    TrendingUp,
};

export function registerMuiIcons() {
    registerStackwrightIcons(muiIconPreset);
}
