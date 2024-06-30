// cspell:word ando, kaito, avenir
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/joy";
import type { SxProps } from "@mui/joy/styles/types";
import { clsx } from "clsx";
import { toPng } from "html-to-image";
import pick from "lodash/pick";
import { nanoid } from "nanoid";
import { type FC, useRef, useState } from "react";

import blue from "./assets/MeetingBG_Engineer_Empty_blue.png";
import white from "./assets/MeetingBG_Engineer_Empty_white.png";

const defaultFontFamily =
  "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";

const randId = nanoid();

const classNames = {
  editMode: `edit-mode-${randId}`,
  blueBg: `blue-bg-${randId}`,
} satisfies Record<string, string>;

const cssVars = {
  textColor: `--text-color-${randId}`,
  font: `--font-${randId}`,
} satisfies Record<string, `--${string}`>;

const sharedStyles = {
  input: (_theme) => ({
    position: "absolute",
    padding: 0,
    border: "none",
    outline: "none",
    left: 72,
    width: 515,
    backgroundColor: "transparent",
    fontFamily: `var(${cssVars.font})`,
    [`.${classNames.editMode} &`]: {
      backgroundColor: `rgba(0, 0, 0, 0.1)`,
    },
    [`.${classNames.editMode}.${classNames.blueBg} &`]: {
      backgroundColor: `rgba(0, 0, 0, 0.2)`,
    },
    color: `var(${cssVars.textColor})`,
  }),
} satisfies Record<PropertyKey, SxProps>;

const styles = {
  painter: {
    position: "absolute",
    inset: 0,
    width: "100dvw",
    height: "100dvh",
    overflow: "auto",
    [`${cssVars.textColor}`]: "black",
    [`&.${classNames.blueBg}`]: {
      [`${cssVars.textColor}`]: "white",
    },
    [`${cssVars.font}`]: defaultFontFamily,
  },
  canvas: {
    width: 1920,
    height: 1080,
    position: "relative",
  },
  toolbar: (theme) => ({
    position: "fixed",
    right: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    transition: "opacity 0.3s ease-in-out",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colorSchemes.dark.palette.neutral.solidColor,
    backgroundColor: theme.colorSchemes.dark.palette.background.body,
    borderRadius: theme.radius.md,
    opacity: 0.2,
    "&:hover": {
      opacity: 1,
    },
  }),
  subName: (theme) => ({
    ...sharedStyles.input(theme),
    fontSize: 28,
    bottom: 274,
  }),
  name: (theme) => ({
    ...sharedStyles.input(theme),
    fontSize: 60,
    bottom: 204,
  }),
  title: (theme) => ({
    ...sharedStyles.input(theme),
    fontSize: 32,
    bottom: 166,
    color: "#4F9EFF",
    [`.${classNames.blueBg} &`]: {
      color: `var(${cssVars.textColor})`,
    },
  }),
  underline: (theme) => ({
    ...pick(sharedStyles.input(theme), ["left", "width"]),
    position: "absolute",
    height: 4,
    bottom: 133,
    backgroundColor: "#9DC5FC",
    [`.${classNames.blueBg} &`]: {
      backgroundColor: "white",
    },
  }),
} satisfies Record<PropertyKey, SxProps>;

const App: FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [editMode, setEditMode] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<string>(defaultFontFamily);
  const [bgType, setBgType] = useState<"white" | "blue">("blue");
  const [name, setName] = useState<string>("安藤 海斗");
  const [subName, setSubName] = useState<string>("Ando Kaito");
  const [title, setTitle] = useState<string>("Fun-end Engineer");
  return (
    <Box
      sx={styles.painter}
      className={clsx(
        editMode && classNames.editMode,
        bgType === "blue" && classNames.blueBg,
      )}
      style={{
        [`${cssVars.font}`]: fontFamily,
      }}
    >
      <Box
        ref={canvasRef}
        sx={styles.canvas}
        style={{
          background: `url(${bgType === "blue" ? blue : white}) no-repeat center center`,
        }}
      >
        <Box
          component="input"
          sx={styles.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <Box
          component="input"
          sx={styles.subName}
          value={subName}
          onChange={(e) => setSubName(e.target.value)}
          placeholder="Sub Name"
        />
        <Box
          component="input"
          sx={styles.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <Box sx={styles.underline} />
      </Box>
      <Box sx={styles.toolbar}>
        <Box
          sx={{
            alignSelf: "stretch",
          }}
        >
          <Checkbox
            checked={editMode}
            onChange={() => setEditMode(!editMode)}
            label="Edit Mode"
          />
        </Box>
        <FormControl
          sx={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <FormLabel>Background</FormLabel>
          <RadioGroup
            orientation="horizontal"
            value={bgType}
            onChange={(e) => setBgType(e.target.value as any)}
            sx={{
              minHeight: 48,
              padding: "4px",
              borderRadius: "12px",
              bgcolor: "neutral.softBg",
              "--RadioGroup-gap": "4px",
              "--Radio-actionRadius": "8px",
            }}
          >
            {["white", "blue"].map((item) => (
              <Radio
                key={item}
                color="neutral"
                value={item}
                disableIcon
                label={item}
                variant="plain"
                sx={{
                  flex: 1,
                  px: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
                slotProps={{
                  action: ({ checked }) => ({
                    sx: {
                      ...(checked && {
                        bgcolor: "background.surface",
                        boxShadow: "sm",
                        "&:hover": {
                          bgcolor: "background.surface",
                        },
                      }),
                    },
                  }),
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
        <FormControl>
          <FormLabel>Font Family</FormLabel>
          <Autocomplete
            value={fontFamily}
            freeSolo
            onInput={(e) => {
              if (!(e.target instanceof HTMLInputElement)) return;
              setFontFamily(e.target.value);
            }}
            onChange={(_e, value) => {
              setFontFamily(value ?? defaultFontFamily);
            }}
            options={[defaultFontFamily]}
          />
        </FormControl>
        <Button
          onClick={async () => {
            if (!canvasRef.current) return;
            const canvasNode = canvasRef.current;
            setEditMode(false);
            const dataUrl = await toPng(canvasNode);
            const link = document.createElement("a");
            link.download = `MeetingBG_Engineer_Empty_${bgType}.png`;
            link.href = dataUrl;
            link.click();
          }}
        >
          Download
        </Button>
      </Box>
    </Box>
  );
};

export default App;
