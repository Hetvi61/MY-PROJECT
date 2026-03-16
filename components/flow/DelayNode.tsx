export default function DelayNode({ data }: any) {

  return (
    <div style={{
      padding: 10,
      border: "1px solid black",
      background: "#fde68a"
    }}>
      ⏳ Wait {data.minutes} minute
    </div>
  )

}