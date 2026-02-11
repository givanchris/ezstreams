import { Navigate, useParams } from "react-router-dom";

const SeriesDetails = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/tv/${id}`} replace />;
};

export default SeriesDetails;
