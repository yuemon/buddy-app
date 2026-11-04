const ICONS={
 pushups:'<circle cx="9" cy="24" r="3.5"/><path d="M14 27L40 36M18.5 28.5V39.5M40 36L43.5 39.5"/><path class="fl" d="M4 41.5H45"/>',
 squats:'<circle cx="23" cy="9" r="3.5"/><path d="M23 14L19 26L29 28L26 40M22 17L34 20"/><path class="fl" d="M12 41.5H40"/>',
 lunges:'<circle cx="22" cy="8" r="3.5"/><path d="M22 13V26L33 28V40M22 26L14 34L7 40"/><path class="fl" d="M4 41.5H42"/>',
 plank:'<circle cx="8" cy="22" r="3.5"/><path d="M12.5 25.5L42 34M15 27.5V37H23M42 34L44 38"/><path class="fl" d="M4 41.5H45"/>',
 situps:'<circle cx="14" cy="17" r="3.5"/><path d="M24 37L17 22M24 37L33 27L38 37M18 24L28 25"/><path class="fl" d="M6 41.5H44"/>',
 burpees:'<circle cx="8" cy="28" r="3.5"/><path d="M12.5 31L30 37M15 32.5V40M40 31V9M34 15L40 9L46 15"/><path class="fl" d="M4 41.5H32"/>',
 jacks:'<circle cx="24" cy="8" r="3.5"/><path d="M24 13V28L14 41M24 28L34 41M24 16L11 8M24 16L37 8"/>',
 glutes:'<circle cx="7" cy="36" r="3.5"/><path d="M11 38L26 25L35 20L40 40M12 40H21"/><path class="fl" d="M3 41.5H45"/>',
 climbers:'<circle cx="9" cy="17" r="3.5"/><path d="M13.5 20.5L34 28L44 36M34 28L24 32L30 37M17 22V38"/><path class="fl" d="M4 41.5H46"/>',
 wallsit:'<path d="M10 5V42"/><circle cx="18" cy="10" r="3.5"/><path d="M15 15V28H30V40M15 19L28 24"/><path class="fl" d="M4 41.5H42"/>',
 calves:'<circle cx="24" cy="7" r="3.5"/><path d="M24 12V27M24 27L21 37L25 41M24 27L28 37L32 41M24 15L17 24M24 15L31 24"/><path class="fl" d="M8 41.5H40"/><path d="M8 20V12M5 15L8 12L11 15M40 20V12M37 15L40 12L43 15"/>',
 superman:'<circle cx="11" cy="34" r="3.5"/><path d="M17 31Q29 37 37 32L45 26M17 30L4 26"/><path class="fl" d="M4 41.5H45"/>',
 pullups:'<path d="M5 6H43" stroke-width="2.6"/><circle cx="24" cy="12.5" r="3.5"/><path d="M24 18V31L20 41M24 31L29 40M24 19L16 22V7M24 19L32 22V7"/>',
 kneeraises:'<path d="M5 6H43" stroke-width="2.6"/><circle cx="20" cy="15" r="3.5"/><path d="M20 20V32L34 33L33 43M20 22L18 7M20 22L26 7"/>',
 deadhang:'<path d="M5 6H43" stroke-width="2.6"/><circle cx="20" cy="14.5" r="3.5"/><path d="M20 20V33L18 44M20 33L23 43M20 22L17 7M20 22L24 7"/><circle cx="38" cy="30" r="5" stroke-width="2.4"/><path d="M38 27.5V30L40 31.5" stroke-width="2.2"/>'
};
const iconSvg=id=>`<svg class="ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ICONS[id]}</svg>`;
