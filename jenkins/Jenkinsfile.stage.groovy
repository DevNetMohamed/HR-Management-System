stage('Update GitOps Repo') {
  steps {
    withCredentials([usernamePassword(credentialsId: 'github-creds',
                                    usernameVariable: 'GIT_USER',
                                    passwordVariable: 'GIT_TOKEN')]) {
      sh '''
        rm -rf hrms-gitops
        git clone https://${GIT_USER}:${GIT_TOKEN}@github.com/DevNetMohamed/HR-Management-System.git
        cd hrms-gitops
        ../jenkins/update-image-tag.sh "${IMAGE_TAG}" hrms/values-dev.yaml
      '''
    }
  }
}
// NOTE: copy update-image-tag.sh into the app repo (or inline its commands),
// and make sure IMAGE_TAG matches the tag you push to Docker Hub.
