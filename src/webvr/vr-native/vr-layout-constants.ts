/** CSS classes for laser/cursor raycasting (see AFrameClientScene raycaster `objects`). */
export const VR_RAYCAST_SELECTOR = ".clickable, .vr-hit";

/** Combined class string for interactive VR UI meshes. */
export const VR_HIT_CLASSES = "clickable vr-hit";

/** Root scale for camera-mounted tablet UI (meters feel readable in-headset). */
export const CAM_UI_TABLET_SCALE = 0.42;

/** Camera-local position for the main control tablet (right, below center). */
export const CAM_UI_TABLET_POSITION = "0.34 -0.2 -0.64";

/** Slight yaw so the tablet faces the user. */
export const CAM_UI_TABLET_ROTATION = "0 -18 0";

/** Second column: findings reader (camera-right of tablet). */
export const CAM_UI_FINDINGS_POSITION = "0.5 -0.08 -0.7";
export const CAM_UI_FINDINGS_ROTATION = "0 -22 0";

/** Minimum tactile button height (meters) on camera UI. */
export const VR_BUTTON_MIN_HEIGHT = 0.1;

/** Minimum button width for primary actions. */
export const VR_BUTTON_MIN_WIDTH = 0.24;

/** World wafer monitor: closer and more frontal than old single board. */
export const WORLD_WAFER_PANEL_POSITION = "-1.82 1.38 -1.95";
export const WORLD_WAFER_PANEL_ROTATION = "0 38 0";
