import { Composition } from "remotion";
import { PLNDemo } from "./PLNDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PLNDemo"
        component={PLNDemo}
        durationInFrames={60 * 30} // 60 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
