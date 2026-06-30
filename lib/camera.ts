/**
 * Camera frame geometry — single source of truth for every surface that shows
 * the live feed, the ROI overlay, or a captured/annotated frame.
 *
 * The RPi captures at 640×480 = 4:3 (raspberry `config.camera_width/height`) and
 * computes the YOLO ROI as a percentage of that frame. Any container that renders
 * a frame or the percentage-based `RoiOverlay` MUST use this exact ratio: with a
 * matching aspect ratio `object-cover` fills the box without cropping, so a "70%"
 * CSS ROI box lines up pixel-for-pixel with the "70%" box the RPi actually filters
 * on. Mismatched container ratios (16:9, arbitrary heights) make `object-cover`
 * crop the frame and the ROI box drifts — and the drift changes with the ratio.
 */
export const CAMERA_WIDTH = 640;
export const CAMERA_HEIGHT = 480;

/** Tailwind class locking a container to the camera frame ratio. */
export const CAMERA_ASPECT_CLASS = "aspect-[4/3]";
