// cspell:words Ando, Kaito, clmbg
import { Autocomplete, Box } from "@mui/joy";
import type { SxProps } from "@mui/joy/styles/types";
import throttle from "lodash/throttle";
import { type ComponentProps, type FC, useMemo } from "react";
import {
  AssetRecordType,
  createTLStore,
  DefaultColorThemePalette,
  DefaultFontFamilies,
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  DefaultQuickActions,
  DefaultQuickActionsContent,
  defaultShapeUtils,
  type Editor,
  exportAs,
  type Geometry2d,
  loadSnapshot,
  type RecordProps,
  Rectangle2d,
  setUserPreferences,
  ShapeUtil,
  StateNode,
  TextShapeUtil,
  type TLBaseShape,
  type TLComponents,
  Tldraw,
  TldrawUiMenuItem,
  type TLTextShape,
  type TLUiOverrides,
  type TLUiToolsContextType,
  useTools,
} from "tldraw";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import lineBlue from "./assets/line_blue.png";
import lineWhite from "./assets/line_white.png";
import bgBlue from "./assets/MeetingBG_Engineer_Empty_blue.png";
import bgWhite from "./assets/MeetingBG_Engineer_Empty_white.png";
import cresclabSvg from "./icons/cresclab.svg?url";
import phExportSvg from "./icons/ph--export.svg?url";
import simpleIconsGithubSvg from "./icons/simple-icons--github.svg?url";

const LOCAL_STORAGE_KEY_SANS = "clmbg-sans";
const LOCAL_STORAGE_KEY_TL_STORE = "clmbg-tl";

/**
 * The URL of images changes in each build, so we need to replace them with
 * placeholders.
 */
const imgAlt = (() => {
  const altRecord = {
    "{{ALT_BG_BLUE}}": bgBlue,
    "{{ALT_BG_WHITE}}": bgWhite,
  } satisfies Record<string, string>;
  function encode(stringified: string) {
    let encoded = stringified;
    for (const [key, value] of Object.entries(altRecord)) {
      encoded = encoded.replace(value, key);
    }
    return encoded;
  }
  function decode(stringified: string) {
    let decoded = stringified;
    for (const [key, value] of Object.entries(altRecord)) {
      decoded = decoded.replace(key, value);
    }
    return decoded;
  }
  return { encode, decode };
})();

const langs = ["en", "zh-TW", "ja", "th"] as const;
type Lang = (typeof langs)[number];

const detectLang = () => {
  function checkLang(input: string): undefined | Lang {
    const exactMatch = langs.find((l) => l === input);
    if (exactMatch) return exactMatch;
    const inputPrefix = input.split("-")[0];
    const prefixMatch = langs.find((l) => l.split("-")[0] === inputPrefix);
    return prefixMatch;
  }
  const defaultLangMatch = checkLang(navigator.language);
  if (defaultLangMatch) return defaultLangMatch;
  for (const lang of navigator.languages) {
    const matched = checkLang(lang);
    if (matched) return matched;
  }
  return langs[0];
};

const langToSans: Record<Lang, string> = {
  en: '"TT Commons Pro", "Noto Sans", sans-serif',
  "zh-TW": '"Noto Sans TC", "Noto Sans", sans-serif',
  ja: '"Noto Sans JP", "Noto Sans", sans-serif',
  th: '"Noto Sans Thai", "Noto Sans", sans-serif',
};

const lang: Lang = detectLang();

const useSansStore = create<{ sans: string }>()(
  persist<{ sans: string }>(() => ({ sans: langToSans[lang] }), {
    name: LOCAL_STORAGE_KEY_SANS,
    storage: createJSONStorage(() => localStorage),
  }),
);

DefaultFontFamilies.sans = useSansStore.getState().sans;
useSansStore.subscribe((state) => {
  DefaultFontFamilies.sans = state.sans;
});

if (useSansStore.getState().sans.trim() === "") {
  useSansStore.setState({ sans: langToSans[lang] });
}

const sansSelector = (state: ReturnType<typeof useSansStore.getState>) =>
  state.sans;
function useSans() {
  return useSansStore(sansSelector);
}

function updateSans(sans: string) {
  useSansStore.setState({ sans });
}

const LanguageSelector: FC = () => {
  const sans = useSans();
  return (
    <Autocomplete
      className="tlui-button"
      value={sans}
      freeSolo
      onInput={(e) => {
        if (!(e.target instanceof HTMLInputElement)) return;
        updateSans(e.target.value);
      }}
      onChange={(_e, value) => {
        updateSans(value ?? langToSans["en"]);
      }}
      options={[
        '"TT Commons Pro", "Noto Sans", sans-serif',
        '"Noto Sans TC", "Noto Sans", sans-serif',
        '"Noto Sans JP", "Noto Sans", sans-serif',
        '"Noto Sans Thai", "Noto Sans", sans-serif',
      ]}
    />
  );
};

const Font: FC = () => {
  const sans = useSans();
  const __html = useMemo(
    () => `
.tl-theme__dark {
  --tl-text-outline: none !important;
  --tl-font-sans: ${sans};
}
text[stroke] {
  display: none !important;
}  
`,
    [sans],
  );
  const dangerouslySetInnerHTML: ComponentProps<"style">["dangerouslySetInnerHTML"] =
    useMemo(
      () => ({
        __html,
      }),
      [__html],
    );
  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <style dangerouslySetInnerHTML={dangerouslySetInnerHTML} />;
};

const styles = {
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100dvw",
    height: "100dvh",
    overflow: "auto",
  },
} satisfies Record<PropertyKey, SxProps>;

const Blue = "#4586f0";
const White = "#fff";

interface Theme {
  bgSrc: string;
  lineSrc: string;
  subName: string;
  name: string;
  nick: string;
  title: string;
  underline: string;
}

const themeBlue: Theme = {
  bgSrc: bgBlue,
  lineSrc: lineWhite,
  subName: "white",
  name: "white",
  nick: "white",
  title: "white",
  underline: "white",
};

const themeWhite: Theme = {
  bgSrc: bgWhite,
  lineSrc: lineBlue,
  subName: "black",
  name: "black",
  nick: "black",
  title: "blue",
  underline: "blue",
};

DefaultColorThemePalette.darkMode.black.solid = "#000";
// Because there is not white color in the picker, use the grey color instead.
DefaultColorThemePalette.darkMode.grey.solid = "#fff";
DefaultColorThemePalette.darkMode.blue.solid = "#4586f0";

type CustomToolName = "repo" | "exportBg" | "bgBlue" | "bgWhite";

export class ExportTool extends StateNode {
  static override id = "exportBg";
}

function defineTools(
  def: Record<CustomToolName, TLUiToolsContextType[keyof TLUiToolsContextType]>,
) {
  return def;
}

function clearAssets(editor: Editor) {
  const assets = Array.from(editor.getAssets());
  editor.deleteAssets(assets);
}

function clearShapes(editor: Editor) {
  const allShapeIds = Array.from(editor.getCurrentPageShapeIds());
  editor.deleteShapes(allShapeIds);
}

function clearEditor(editor: Editor) {
  clearShapes(editor);
  clearAssets(editor);
}

/**
 * Fix the text auto-size issue by updating the text shape.
 */
function fixTextAutoSize(editor: Editor) {
  const textShapeUtils = editor.shapeUtils["text"];
  if (!(textShapeUtils instanceof TextShapeUtil)) return;
  const shapes = editor.getCurrentPageShapes();
  const textShapes = shapes.filter(
    (shape): shape is TLTextShape => shape.type === "text",
  );
  for (const textShape of textShapes) {
    // Update the text shape to trigger a re-render
    const currentText = textShape.props.text;
    editor.updateShape({
      id: textShape.id,
      type: textShape.type,
      props: {
        text: "",
      },
    });
    editor.updateShape({
      id: textShape.id,
      type: textShape.type,
      props: {
        text: currentText,
      },
    });
  }
}

const HEIGHT = 1080;
const WIDTH = 1920;
const LINE_LENGTH = 515;
const LINE_WIDTH = 4;
const LINE_TOP = 944;
const LINE_LEFT = 78;

function initBg(editor: Editor, color: "blue" | "white") {
  clearEditor(editor);

  const bgAssetId = AssetRecordType.createId();
  const lineAssetId = AssetRecordType.createId();

  const theme = color === "blue" ? themeBlue : themeWhite;

  // Backaground image
  editor.createAssets([
    {
      id: bgAssetId,
      type: "image",
      typeName: "asset",
      props: {
        name: color === "white" ? "bg-white.png" : "bg-blue.png",
        src: theme.bgSrc,
        w: WIDTH,
        h: HEIGHT,
        mimeType: "image/png",
        isAnimated: false,
      },
      meta: {},
    },
    {
      id: lineAssetId,
      type: "image",
      typeName: "asset",
      props: {
        name: color === "white" ? "line-blue.png" : "line-white.png",
        src: color === "white" ? lineBlue : lineWhite,
        w: LINE_LENGTH,
        h: LINE_WIDTH,
        mimeType: "image/png",
        isAnimated: false,
      },
      meta: {},
    },
  ]);
  editor.createShapes([
    {
      type: "styled",
      x: 0,
      y: 0,
    },
    {
      type: "image",
      x: 0,
      y: 0,
      props: {
        w: WIDTH,
        h: HEIGHT,
        assetId: bgAssetId,
      },
    },
    {
      type: "image",
      x: LINE_LEFT,
      y: LINE_TOP + LINE_WIDTH / 2,
      props: {
        w: LINE_LENGTH,
        h: LINE_WIDTH,
        assetId: lineAssetId,
      },
    },
    {
      type: "text",
      x: LINE_LEFT,
      y: 886,
      props: {
        font: "sans",
        text: "Fun-end Engineer",
        color: theme.title,
        size: "m",
        scale: 1.5, // 36 / 24
      },
    },
    {
      type: "text",
      x: LINE_LEFT,
      y: 805.16,
      props: {
        font: "sans",
        text: "安藤 海斗",
        color: theme.name,
        size: "m",
        scale: 2.67, // 64 / 24
      },
    },
    {
      type: "text",
      x: LINE_LEFT + 284,
      y: 826.877,
      props: {
        font: "sans",
        text: "(超かわ (*･ω･) ﾉ)",
        color: theme.nick,
        size: "m",
        scale: 2, // 48 / 24
      },
    },
    {
      type: "text",
      x: LINE_LEFT,
      y: 765,
      props: {
        font: "sans",
        text: "Ando Kaito",
        color: theme.subName,
        size: "m",
        scale: 1.33, // 32 / 24
      },
    },
  ]);

  // fit the canvas to the new image
  editor.zoomToFit();
}

const overrides: TLUiOverrides = {
  tools(editor, tools) {
    Object.assign(
      tools,
      defineTools({
        repo: {
          id: "repo",
          icon: "repo",
          label: "GitHub",
          onSelect: () => {
            window.open(
              "https://github.com/chatbotgang/meeting-bg-generator",
              "_blank",
              "noopener noreferrer",
            );
          },
        },
        exportBg: {
          id: "exportBg",
          icon: "exportBg",
          label: "Export Background",
          kbd: "s",
          onSelect: () => {
            const ids = Array.from(editor.getCurrentPageShapeIds().values());
            exportAs(editor, ids, "png", undefined, {
              darkMode: true,
              padding: 0,
            });
          },
        },
        bgBlue: {
          id: "bgBlue",
          icon: "bgBlue",
          label: "Blue Background",
          onSelect: () => {
            // eslint-disable-next-line no-alert
            const confirm = window.confirm(
              "This will clear the current canvas. Are you sure?",
            );
            if (!confirm) return;
            initBg(editor, "blue");
          },
        },
        bgWhite: {
          id: "bgWhite",
          icon: "bgWhite",
          label: "White Background",
          onSelect: () => {
            // eslint-disable-next-line no-alert
            const confirm = window.confirm(
              "This will clear the current canvas. Are you sure?",
            );
            if (!confirm) return;
            initBg(editor, "white");
          },
        },
      }),
    );
    return tools;
  },
};

function getTool(tool: TLUiToolsContextType, name: CustomToolName) {
  return tool[name]!;
}

const components: TLComponents = {
  KeyboardShortcutsDialog: (props) => {
    const tools = useTools();
    return (
      <DefaultKeyboardShortcutsDialog {...props}>
        <DefaultKeyboardShortcutsDialogContent />
        <TldrawUiMenuItem {...getTool(tools, "exportBg")} />
      </DefaultKeyboardShortcutsDialog>
    );
  },
  QuickActions: (props) => {
    const tools = useTools();
    return (
      <DefaultQuickActions {...props}>
        <DefaultQuickActionsContent />
        <Box
          component="span"
          sx={{
            "& > *": {
              color: Blue,
            },
          }}
        >
          <TldrawUiMenuItem {...getTool(tools, "bgBlue")} />
        </Box>
        <Box
          component="span"
          sx={{
            "& > *": {
              color: White,
            },
          }}
        >
          <TldrawUiMenuItem {...getTool(tools, "bgWhite")} />
        </Box>
        <LanguageSelector />
        <TldrawUiMenuItem {...getTool(tools, "exportBg")} />
        <TldrawUiMenuItem {...getTool(tools, "repo")} />
      </DefaultQuickActions>
    );
  },
};

const tools: ComponentProps<typeof Tldraw>["tools"] = [];

function defineIcons(def: Record<CustomToolName, string>) {
  return def;
}

const assetUrls: ComponentProps<typeof Tldraw>["assetUrls"] = {
  icons: defineIcons({
    exportBg: phExportSvg,
    repo: simpleIconsGithubSvg,
    bgBlue: cresclabSvg,
    bgWhite: cresclabSvg,
  }),
};

type StyledShape = TLBaseShape<"styled-shape", NonNullable<unknown>>;

class StyledShapeUtil extends ShapeUtil<StyledShape> {
  static override type = "styled" as const;
  static override props: RecordProps<StyledShape> = {};
  getDefaultProps(): StyledShape["props"] {
    return {};
  }
  override canEdit() {
    return false;
  }
  override canResize() {
    return false;
  }
  override isAspectRatioLocked() {
    return true;
  }

  getGeometry(_shape: StyledShape): Geometry2d {
    return new Rectangle2d({
      width: 0,
      height: 0,
      isFilled: false,
    });
  }
  component(_shape: StyledShape) {
    return <Font />;
  }
  indicator() {
    return null;
  }
}

const shapeUtils: ComponentProps<typeof Tldraw>["shapeUtils"] = [
  StyledShapeUtil,
];

const store = (() => {
  const store = createTLStore({
    shapeUtils: [...defaultShapeUtils, ...(shapeUtils as any)],
  });

  const stringified = localStorage.getItem(LOCAL_STORAGE_KEY_TL_STORE);
  const snapshot: Parameters<typeof loadSnapshot>[1] = !stringified
    ? {}
    : // This can be dangerous if the stringified data is not safe
      (JSON.parse(imgAlt.decode(stringified)) as any);
  loadSnapshot(store, snapshot);

  const saveToLocalStorage = () => {
    const snapshot = store.getStoreSnapshot();
    localStorage.setItem(
      LOCAL_STORAGE_KEY_TL_STORE,
      imgAlt.encode(JSON.stringify(snapshot)),
    );
  };
  const throttledSave = throttle(saveToLocalStorage, 300);
  store.listen(throttledSave);
  return store;
})();

const onMount: ComponentProps<typeof Tldraw>["onMount"] = (editor) => {
  Object.assign(
    editor.bindingUtils,
    Object.fromEntries(shapeUtils.map((s) => [s.type, s])),
  );

  const userId = editor.user.getId();
  /**
   * As a workaround to address the poor visibility of white icons, force
   * switching to dark mode on the initial load.
   */
  setUserPreferences({
    id: userId,
    colorScheme: "dark",
  });
  const shapes = editor.getCurrentPageShapeIds();
  if (shapes.size === 0) {
    /**
     * Initialize the canvas with a blue background if the canvas is empty
     * on first load.
     */
    initBg(editor, "blue");
  }
  useSansStore.subscribe(() => {
    // After the font is updated, adjust the text size based on the new font.
    // Since the font update occurs only after React re-renders, we need to wait
    // until the next tick.
    setTimeout(() => {
      fixTextAutoSize(editor);
    }, 0);
  });
  fixTextAutoSize(editor);
  editor.zoomToFit();
};

const App: FC = () => {
  return (
    <Box sx={styles.canvas}>
      <Tldraw
        store={store}
        tools={tools}
        overrides={overrides}
        components={components}
        assetUrls={assetUrls}
        shapeUtils={shapeUtils}
        onMount={onMount}
      />
    </Box>
  );
};

export default App;
