import { Composition } from "remotion";
import { PLNPromo } from "./PLNPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PLNPromo"
        component={PLNPromo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
