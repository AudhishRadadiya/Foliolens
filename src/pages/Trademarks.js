import React from "react";
import Container from "../components/Layout/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function Trademarks() {
  return (
    <Container title="Trademarks" isBack>
      <div className="trademark">
        <Row>
          <Col md={9}>
            <p className="text-grey">Last upgated: September 3, 2021</p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae bibendum leo, eget venenatis est.
              Nulla aliquam, purus at viverra molestie, urna mauris suscipit justo, sit amet imperdiet tortor mi a
              ligula. Integer sed turpis leo. Proin eu bibendum lorem. Pellentesque interdum ipsum eget velit euismod, a
              placerat nulla eleifend. Suspendisse arcu eros, bibendum a feugiat dignissim, maximus laoreet est.
              Maecenas odio nisl, interdum ut nisl vel, fringilla efficitur lorem. Morbi nec varius ante, ac bibendum
              ligula. Sed sem diam, finibus convallis tempus ut, lobortis sit amet erat. Vivamus vestibulum suscipit
              neque, eu lobortis mi pulvinar sed. Donec id interdum ante. Sed vehicula aliquet mauris eu aliquet.
              Aliquam ut ante iaculis, pretium arcu sit amet, porttitor odio. Morbi velit sapien, bibendum id metus
              posuere, congue tincidunt lacus.
            </p>
            <p>
              Vivamus aliquam pretium dui, id mollis odio vestibulum vitae. Etiam vitae lectus turpis. Nam tincidunt
              scelerisque mauris, non dignissim ipsum finibus vulputate. Integer vitae ullamcorper sem, posuere feugiat
              ex. Proin bibendum ante volutpat placerat feugiat. Donec maximus nisi vitae lacus congue pharetra. Donec
              pulvinar felis non vestibulum convallis. Morbi quis ipsum eu lacus varius porta. Cras a lacinia est. Etiam
              imperdiet non nisi vel viverra. Aliquam pulvinar elementum sollicitudin. Phasellus in nunc neque. Aenean
              semper sodales libero vitae vestibulum. Vestibulum vitae vestibulum lectus. Donec aliquam dignissim felis
              eu bibendum. Aliquam consequat finibus tortor, at tincidunt est ultrices at.
            </p>
            <p>
              Vivamus placerat rutrum ipsum, sit amet elementum sapien tincidunt eget. Suspendisse vitae dignissim
              justo. Proin in lorem nec enim congue placerat et ac lorem. Proin iaculis accumsan enim, vel molestie
              augue dictum a. Nunc ut tincidunt est. Maecenas suscipit magna aliquet magna feugiat ornare. Donec eget
              porta dolor, sed eleifend sem. Ut cursus augue vitae neque elementum condimentum. Proin accumsan imperdiet
              dolor at congue. Donec congue rhoncus nunc eu consectetur. Cras in iaculis ex, quis porta ante.
            </p>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
