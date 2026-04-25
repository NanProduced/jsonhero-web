import { MultiFormatInput } from "./MultiFormatInput";
import { Title } from "./Primitives/Title";
import { SampleUrls } from "./SampleUrls";

export function NewFile() {
  return (
    <div>
      <MultiFormatInput />

      <div className="mt-6 pt-5">
        <Title className="mb-2 text-slate-200">No data? Try it out:</Title>
        <SampleUrls />
      </div>
    </div>
  );
}
