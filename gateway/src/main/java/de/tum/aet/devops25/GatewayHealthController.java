package de.tum.aet.devops25;

import de.tum.aet.devops25.api.generated.controller.HealthApi;
import de.tum.aet.devops25.api.generated.model.GetGatewayHealth200Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
public class GatewayHealthController implements HealthApi {

    @Override
    public ResponseEntity<GetGatewayHealth200Response> getGatewayHealth() {
        GetGatewayHealth200Response response = new GetGatewayHealth200Response();
        response.setStatus("UP");
        response.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.ok(response);
    }
}
